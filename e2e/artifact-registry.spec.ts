import { test, expect } from '@playwright/test';

test.describe('Artifact Registry E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Artifact Save Workflow', () => {
    test('should save a new artifact through the complete user workflow', async ({ page }) => {
      // Step 1: Navigate to chat interface
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-interface"]');

      // Step 2: Generate an artifact (simulate AI response)
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Create a simple React button component');
      await chatInput.press('Enter');

      // Wait for AI response with artifact
      await page.waitForSelector('[data-testid="artifact-preview"]', { timeout: 30000 });

      // Step 3: Click the save button on the artifact
      const saveButton = page.locator('[data-testid="artifact-save-button"]');
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Step 4: Fill out the save form
      await page.waitForSelector('[data-testid="artifact-save-modal"]');

      const nameInput = page.locator('[data-testid="artifact-name-input"]');
      await nameInput.fill('My Button Component');

      const descriptionInput = page.locator('[data-testid="artifact-description-input"]');
      await descriptionInput.fill('A reusable button component for the UI');

      const categorySelect = page.locator('[data-testid="artifact-category-select"]');
      await categorySelect.selectOption('ui-component');

      const tagsInput = page.locator('[data-testid="artifact-tags-input"]');
      await tagsInput.fill('react, button, ui');

      // Step 5: Submit the save form
      const submitButton = page.locator('[data-testid="artifact-save-submit"]');
      await submitButton.click();

      // Step 6: Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Artifact saved successfully',
      );

      // Step 7: Navigate to artifact registry to verify it was saved
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Verify the artifact appears in the registry
      const artifactCard = page
        .locator('[data-testid="artifact-card"]')
        .filter({ hasText: 'My Button Component' });
      await expect(artifactCard).toBeVisible();
      await expect(artifactCard).toContainText('A reusable button component for the UI');
    });

    test('should validate required fields in save form', async ({ page }) => {
      // Navigate to chat and generate an artifact
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-interface"]');

      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Create a simple div element');
      await chatInput.press('Enter');

      await page.waitForSelector('[data-testid="artifact-preview"]');

      // Click save button
      const saveButton = page.locator('[data-testid="artifact-save-button"]');
      await saveButton.click();

      await page.waitForSelector('[data-testid="artifact-save-modal"]');

      // Try to submit without filling required fields
      const submitButton = page.locator('[data-testid="artifact-save-submit"]');
      await submitButton.click();

      // Verify validation errors
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
      await expect(page.locator('[data-testid="description-error"]')).toContainText(
        'Description is required',
      );
    });
  });

  test.describe('Artifact Registry Browser', () => {
    test('should browse and search artifacts', async ({ page }) => {
      // Navigate to artifact registry
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Test search functionality
      const searchInput = page.locator('[data-testid="artifact-search"]');
      await searchInput.fill('button');

      // Wait for search results
      await page.waitForTimeout(1000); // Debounce delay

      // Verify search results contain only button-related artifacts
      const artifactCards = page.locator('[data-testid="artifact-card"]');
      const count = await artifactCards.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const card = artifactCards.nth(i);
          const text = await card.textContent();
          expect(text?.toLowerCase()).toMatch(/button|btn/);
        }
      }

      // Test category filtering
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      await categoryFilter.selectOption('ui-component');

      await page.waitForTimeout(500);

      // Verify filtered results
      const filteredCards = page.locator('[data-testid="artifact-card"]');
      const filteredCount = await filteredCards.count();

      if (filteredCount > 0) {
        // Check that all visible cards are UI components
        for (let i = 0; i < filteredCount; i++) {
          const card = filteredCards.nth(i);
          const categoryBadge = card.locator('[data-testid="artifact-category"]');
          await expect(categoryBadge).toContainText('UI Component');
        }
      }

      // Test sorting
      const sortSelect = page.locator('[data-testid="sort-select"]');
      await sortSelect.selectOption('name-asc');

      await page.waitForTimeout(500);

      // Verify sorting (check that first item comes before second alphabetically)
      const sortedCards = page.locator('[data-testid="artifact-card"]');
      const sortedCount = await sortedCards.count();

      if (sortedCount >= 2) {
        const firstCardName = await sortedCards
          .nth(0)
          .locator('[data-testid="artifact-name"]')
          .textContent();
        const secondCardName = await sortedCards
          .nth(1)
          .locator('[data-testid="artifact-name"]')
          .textContent();

        if (firstCardName && secondCardName) {
          expect(firstCardName.localeCompare(secondCardName)).toBeLessThanOrEqual(0);
        }
      }
    });

    test('should switch between grid and list view modes', async ({ page }) => {
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Start in grid view (default)
      const gridViewButton = page.locator('[data-testid="grid-view-button"]');
      const listViewButton = page.locator('[data-testid="list-view-button"]');

      // Verify grid view is active
      await expect(gridViewButton).toHaveClass(/active/);

      const gridContainer = page.locator('[data-testid="artifacts-grid"]');
      await expect(gridContainer).toBeVisible();

      // Switch to list view
      await listViewButton.click();

      // Verify list view is active
      await expect(listViewButton).toHaveClass(/active/);

      const listContainer = page.locator('[data-testid="artifacts-list"]');
      await expect(listContainer).toBeVisible();

      // Switch back to grid view
      await gridViewButton.click();
      await expect(gridViewButton).toHaveClass(/active/);
      await expect(gridContainer).toBeVisible();
    });
  });

  test.describe('Artifact Reference and Composition', () => {
    test('should reference artifacts using @mention syntax', async ({ page }) => {
      // Navigate to chat
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-interface"]');

      // Type @ to trigger artifact mention
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Use @');

      // Wait for autocomplete dropdown
      await page.waitForSelector('[data-testid="artifact-autocomplete"]');

      // Verify autocomplete shows available artifacts
      const autocompleteItems = page.locator('[data-testid="autocomplete-item"]');
      await expect(autocompleteItems.first()).toBeVisible();

      // Select an artifact from autocomplete
      await autocompleteItems.first().click();

      // Verify the artifact reference is inserted
      const inputValue = await chatInput.inputValue();
      expect(inputValue).toMatch(/@\[[\w\s-]+\]/);

      // Send the message
      await chatInput.press('Enter');

      // Verify the referenced artifact is highlighted in the response
      await page.waitForSelector('[data-testid="artifact-reference"]');
      const artifactReference = page.locator('[data-testid="artifact-reference"]');
      await expect(artifactReference).toBeVisible();
    });

    test('should compose multiple artifacts together', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-interface"]');

      // Request composition of multiple artifacts
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Create a form using @[Button Component] and @[Input Component]');
      await chatInput.press('Enter');

      // Wait for AI response with composed artifact
      await page.waitForSelector('[data-testid="artifact-preview"]', { timeout: 30000 });

      // Verify the composed artifact contains references to both components
      const artifactCode = page.locator('[data-testid="artifact-code"]');
      const codeContent = await artifactCode.textContent();

      expect(codeContent).toContain('Button Component');
      expect(codeContent).toContain('Input Component');

      // Verify the artifact container shows both embedded components
      const embeddedComponents = page.locator('[data-testid="embedded-component"]');
      await expect(embeddedComponents).toHaveCount(2);
    });
  });

  test.describe('Focus Management and LLM Containment', () => {
    test('should prevent modification of non-focused artifacts', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-interface"]');

      // Generate first artifact
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Create a button component');
      await chatInput.press('Enter');

      await page.waitForSelector('[data-testid="artifact-preview"]');

      // Focus on the first artifact
      const firstArtifact = page.locator('[data-testid="artifact-preview"]').first();
      await firstArtifact.click();

      // Verify focus indicator
      await expect(firstArtifact).toHaveClass(/focused/);

      // Generate second artifact
      await chatInput.fill('Create a card component');
      await chatInput.press('Enter');

      await page.waitForSelector('[data-testid="artifact-preview"]').nth(1);

      // Try to modify the first (focused) artifact - should work
      await chatInput.fill('Make the button red');
      await chatInput.press('Enter');

      // Wait for modification
      await page.waitForTimeout(2000);

      // Verify the first artifact was modified
      const firstArtifactCode = await firstArtifact
        .locator('[data-testid="artifact-code"]')
        .textContent();
      expect(firstArtifactCode).toContain('red');

      // Try to modify the second (non-focused) artifact - should be prevented
      await chatInput.fill('Make the card blue');
      await chatInput.press('Enter');

      // Verify containment message is shown
      await expect(page.locator('[data-testid="containment-message"]')).toContainText(
        'Cannot modify non-focused artifact',
      );
    });

    test('should clear focus when requested', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-interface"]');

      // Generate and focus an artifact
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Create a button');
      await chatInput.press('Enter');

      await page.waitForSelector('[data-testid="artifact-preview"]');

      const artifact = page.locator('[data-testid="artifact-preview"]');
      await artifact.click();
      await expect(artifact).toHaveClass(/focused/);

      // Clear focus using keyboard shortcut
      await page.keyboard.press('Escape');

      // Verify focus is cleared
      await expect(artifact).not.toHaveClass(/focused/);

      // Or clear focus using command
      await chatInput.fill('Clear focus');
      await chatInput.press('Enter');

      // Verify all artifacts are unfocused
      const allArtifacts = page.locator('[data-testid="artifact-preview"]');
      const count = await allArtifacts.count();

      for (let i = 0; i < count; i++) {
        await expect(allArtifacts.nth(i)).not.toHaveClass(/focused/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept API calls and simulate network error
      await page.route('/api/artifacts/**', (route) => {
        route.abort('failed');
      });

      await page.goto('/artifacts');

      // Verify error message is displayed
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Failed to load artifacts',
      );

      // Verify retry button is available
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();

      // Remove network error simulation
      await page.unroute('/api/artifacts/**');

      // Click retry button
      await retryButton.click();

      // Verify artifacts load successfully after retry
      await page.waitForSelector('[data-testid="artifact-card"]');
    });

    test('should handle Supabase connection errors', async ({ page }) => {
      // Simulate Supabase connection error
      await page.route('/api/artifacts/test-connection', (route) => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Supabase connection failed' },
          }),
        });
      });

      await page.goto('/artifacts/settings');

      // Test Supabase connection
      const testConnectionButton = page.locator('[data-testid="test-connection-button"]');
      await testConnectionButton.click();

      // Verify error is displayed
      await expect(page.locator('[data-testid="connection-error"]')).toContainText(
        'Supabase connection failed',
      );

      // Verify fallback options are shown
      await expect(page.locator('[data-testid="fallback-options"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Test tab navigation through artifact cards
      await page.keyboard.press('Tab');

      const firstCard = page.locator('[data-testid="artifact-card"]').first();
      await expect(firstCard).toBeFocused();

      // Navigate to next card
      await page.keyboard.press('Tab');

      const secondCard = page.locator('[data-testid="artifact-card"]').nth(1);
      if ((await secondCard.count()) > 0) {
        await expect(secondCard).toBeFocused();
      }

      // Test Enter key activation
      await page.keyboard.press('Enter');

      // Verify artifact details are shown or action is triggered
      await expect(page.locator('[data-testid="artifact-details"]')).toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Check main landmark
      const main = page.locator('main');
      await expect(main).toHaveAttribute('aria-label', 'Artifact Registry');

      // Check search input
      const searchInput = page.locator('[data-testid="artifact-search"]');
      await expect(searchInput).toHaveAttribute('aria-label', 'Search artifacts');
      await expect(searchInput).toHaveAttribute('role', 'search');

      // Check artifact cards
      const artifactCards = page.locator('[data-testid="artifact-card"]');
      const count = await artifactCards.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const card = artifactCards.nth(i);
          await expect(card).toHaveAttribute('role', 'article');
          await expect(card).toHaveAttribute('aria-label');
          await expect(card).toHaveAttribute('tabindex', '0');
        }
      }
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Test loading state announcement
      const searchInput = page.locator('[data-testid="artifact-search"]');
      await searchInput.fill('test search');

      // Verify loading announcement
      const loadingStatus = page.locator('[role="status"]');
      await expect(loadingStatus).toContainText(/loading/i);

      // Wait for results and verify completion announcement
      await page.waitForTimeout(1000);
      await expect(loadingStatus).toContainText(/search complete/i);
    });
  });

  test.describe('Performance', () => {
    test('should load large artifact collections efficiently', async ({ page }) => {
      // Navigate to artifacts page
      await page.goto('/artifacts');

      // Measure initial load time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="artifact-card"]');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (less than 3 seconds)
      expect(loadTime).toBeLessThan(3000);

      // Test virtual scrolling with large collections
      const artifactCards = page.locator('[data-testid="artifact-card"]');
      const initialCount = await artifactCards.count();

      // Scroll to bottom to trigger more loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for additional items to load
      await page.waitForTimeout(1000);

      const newCount = await artifactCards.count();

      // Should load more items or maintain performance with virtual scrolling
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('should handle concurrent operations without conflicts', async ({ page }) => {
      await page.goto('/artifacts');
      await page.waitForSelector('[data-testid="artifact-registry"]');

      // Perform multiple operations simultaneously
      const searchInput = page.locator('[data-testid="artifact-search"]');
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      const sortSelect = page.locator('[data-testid="sort-select"]');

      // Start multiple operations at once
      await Promise.all([
        searchInput.fill('button'),
        categoryFilter.selectOption('ui-component'),
        sortSelect.selectOption('name-asc'),
      ]);

      // Wait for all operations to complete
      await page.waitForTimeout(2000);

      // Verify final state is consistent
      await expect(searchInput).toHaveValue('button');
      await expect(categoryFilter).toHaveValue('ui-component');
      await expect(sortSelect).toHaveValue('name-asc');

      // Verify results reflect all filters
      const results = page.locator('[data-testid="artifact-card"]');
      const count = await results.count();

      if (count > 0) {
        // Check that results match all applied filters
        const firstResult = results.first();
        const text = await firstResult.textContent();
        expect(text?.toLowerCase()).toContain('button');

        const categoryBadge = firstResult.locator('[data-testid="artifact-category"]');
        await expect(categoryBadge).toContainText('UI Component');
      }
    });
  });
});
