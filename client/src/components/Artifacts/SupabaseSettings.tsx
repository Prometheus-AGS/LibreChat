import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Database, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Button, Input, Label, Switch } from '@librechat/client';
import { useLocalize } from '~/hooks';
import type { TSupabaseConfig } from 'librechat-data-provider';

interface SupabaseSettingsProps {
  config?: TSupabaseConfig;
  onSave: (config: TSupabaseConfig) => void;
  onTest?: (config: TSupabaseConfig) => Promise<boolean>;
  loading?: boolean;
}

export function SupabaseSettings({
  config,
  onSave,
  onTest,
  loading = false,
}: SupabaseSettingsProps) {
  const localize = useLocalize();
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [url, setUrl] = useState(config?.url ?? '');
  const [anonKey, setAnonKey] = useState(config?.anonKey ?? '');
  const [serviceKey, setServiceKey] = useState(config?.serviceKey ?? '');
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (enabled) {
      if (!url) {
        newErrors.url = 'URL is required when Supabase is enabled';
      } else if (!url.match(/^https?:\/\/.+/)) {
        newErrors.url = 'Please enter a valid URL';
      }

      if (!anonKey) {
        newErrors.anonKey = 'Anonymous key is required when Supabase is enabled';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [enabled, url, anonKey]);

  const handleTestConnection = useCallback(async () => {
    if (!onTest) return;

    if (!enabled || !url || !anonKey) {
      setTestResult({
        success: false,
        message: 'Please fill in URL and Anonymous Key before testing',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const success = await onTest({
        enabled,
        url,
        anonKey,
        serviceKey: serviceKey || undefined,
      });

      setTestResult({
        success,
        message: success
          ? 'Connection successful! Supabase is configured correctly.'
          : 'Connection failed. Please check your credentials and try again.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  }, [onTest, enabled, url, anonKey, serviceKey]);

  const handleSave = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    onSave({
      enabled,
      url: url || undefined,
      anonKey: anonKey || undefined,
      serviceKey: serviceKey || undefined,
    });
  }, [onSave, enabled, url, anonKey, serviceKey, validateForm]);

  const handleEnabledChange = useCallback((checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setErrors({});
      setTestResult(null);
    }
  }, []);

  return (
    <div className="w-full rounded-lg border border-border-medium bg-surface-primary p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Supabase Configuration</h3>
        </div>
        <p className="text-sm text-text-secondary">
          Configure Supabase database connection for this artifact. When enabled, the artifact will
          have access to a{' '}
          <code className="rounded bg-surface-secondary px-1 py-0.5 text-xs">createSupabase()</code>{' '}
          function.
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable Supabase Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-base font-medium">
              Enable Supabase
            </Label>
            <p className="text-sm text-text-secondary">
              Allow this artifact to connect to a Supabase database
            </p>
          </div>
          <Switch id="enabled" checked={enabled} onCheckedChange={handleEnabledChange} />
        </div>

        {enabled && (
          <>
            <div className="h-px bg-border-medium" />

            {/* Supabase URL */}
            <div className="space-y-2">
              <Label htmlFor="url">
                Supabase URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
              <p className="text-xs text-text-secondary">
                Your Supabase project URL from the project settings
              </p>
            </div>

            {/* Anonymous Key */}
            <div className="space-y-2">
              <Label htmlFor="anonKey">
                Anonymous Key <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="anonKey"
                  type={showAnonKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className={`pr-10 ${errors.anonKey ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                >
                  {showAnonKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.anonKey && <p className="text-sm text-red-500">{errors.anonKey}</p>}
              <p className="text-xs text-text-secondary">
                The anonymous/public key for client-side access (safe to expose)
              </p>
            </div>

            {/* Service Key (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="serviceKey">
                Service Role Key <span className="text-xs text-text-secondary">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="serviceKey"
                  type={showServiceKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowServiceKey(!showServiceKey)}
                >
                  {showServiceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-text-secondary">
                Service role key for admin operations (use with caution)
              </p>
            </div>

            {/* Test Connection */}
            {onTest && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !enabled}
                  className="w-full"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testing ? 'Testing Connection...' : 'Test Connection'}
                </Button>

                {testResult && (
                  <div
                    className={`rounded-md border p-3 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <p
                        className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}
                      >
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        {/* Usage Information */}
        {enabled && (
          <>
            <div className="h-px bg-border-medium" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Usage in Artifact</h4>
              <div className="rounded-md bg-surface-secondary p-3 font-mono text-xs">
                <div className="space-y-1">
                  <div>// Import the helper function</div>
                  <div>import {'{ createSupabase }'} from '/lib/supabase';</div>
                  <div></div>
                  <div>// Create Supabase client</div>
                  <div>const supabase = createSupabase();</div>
                  <div></div>
                  <div>// Use with service key (if provided)</div>
                  <div>const adminSupabase = createSupabase({'{ useServiceKey: true }'});</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
