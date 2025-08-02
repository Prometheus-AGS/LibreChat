# LibreChat Roo Development Commands

This file provides Roo command equivalents for the development commands listed in CLAUDE.md.

## Setup and Installation

### Initial Project Setup
```roo
project setup --topLevelPackage com.librechat --projectName LibreChat --java 17 --packaging JAR
```

### Dependencies Setup (equivalent to npm install)
```roo
dependency add --groupId org.springframework.boot --artifactId spring-boot-starter-web
dependency add --groupId org.springframework.boot --artifactId spring-boot-starter-data-jpa
dependency add --groupId org.springframework.boot --artifactId spring-boot-starter-security
dependency add --groupId org.springframework.boot --artifactId spring-boot-starter-validation
```

## Backend Development

### Run backend in development mode (equivalent to npm run backend:dev)
```roo
web mvc embedded --port 3080
```

### Alternative development server
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Frontend Development

### Setup web layer (equivalent to npm run frontend:dev)
```roo
web mvc setup
web mvc view setup --type THYMELEAF
```

## Build Commands

### Build data layer (equivalent to npm run build:data-provider)
```roo
jpa setup --provider HIBERNATE --database HYPERSONIC_IN_MEMORY
entity jpa --class ~.domain.User --activeRecord false
```

### Build API layer (equivalent to npm run build:api)
```roo
web mvc controller --class ~.web.UserController --entity ~.domain.User
web mvc json setup
web mvc json add --class ~.domain.User
```

### Build entire application (equivalent to npm run backend && npm run frontend)
```roo
perform clean compile package
```

## Testing

### Run unit tests (equivalent to npm run test:client && npm run test:api)
```roo
test integration --entity ~.domain.User
test unit --class ~.service.UserService
```

### Run E2E tests (equivalent to npm run e2e)
```roo
selenium test --controller ~.web.UserController
```

### Run tests with debugging (equivalent to npm run e2e:debug)
```bash
mvn test -Dmaven.surefire.debug
```

## Code Quality

### Run linting equivalent
```roo
logging setup --level DEBUG
```

### Format code equivalent
```bash
mvn spotless:apply
```

## User Management

### Create user management functionality
```roo
entity jpa --class ~.domain.User --activeRecord false
field string --fieldName username --notNull --unique
field string --fieldName email --notNull --unique
field string --fieldName password --notNull
service --interface ~.service.UserService --entity ~.domain.User
web mvc controller --class ~.web.UserController --entity ~.domain.User
```

### Add user finders (equivalent to user management commands)
```roo
finder add --finderName findUsersByEmail --class ~.domain.User
finder add --finderName findUsersByUsernameEquals --class ~.domain.User
finder add --finderName findUsersByIsActiveEquals --class ~.domain.User
```

## Balance Management

### Create balance management functionality
```roo
entity jpa --class ~.domain.UserBalance --activeRecord false
field number --fieldName balance --type java.math.BigDecimal --notNull
field reference --fieldName user --type ~.domain.User --notNull
service --interface ~.service.BalanceService --entity ~.domain.UserBalance
```

## Architecture Setup Commands

### Backend (API) Setup
```roo
# Framework setup (Express.js equivalent)
web mvc setup

# Database setup (MongoDB equivalent)
jpa setup --provider HIBERNATE --database HYPERSONIC_IN_MEMORY

# Authentication setup (Passport.js equivalent)
security setup
```

### Frontend (Client) Setup
```roo
# UI framework setup (React equivalent)
web mvc view setup --type THYMELEAF

# State management setup
web flow setup
```

### Key Features Setup

#### AI Model Integration
```roo
entity jpa --class ~.domain.AIProvider --activeRecord false
field string --fieldName name --notNull
field string --fieldName apiKey
field string --fieldName baseUrl
field enum --fieldName providerType --type ~.domain.ProviderType
```

#### Chat Functionality
```roo
entity jpa --class ~.domain.Conversation --activeRecord false
entity jpa --class ~.domain.Message --activeRecord false
field reference --fieldName conversation --type ~.domain.Conversation --notNull
```

#### File Handling
```roo
entity jpa --class ~.domain.File --activeRecord false
field string --fieldName filename --notNull
field string --fieldName path --notNull
field number --fieldName size --type java.lang.Long
```

## Development Workflow

1. **Initial Setup**: Run the main Roo script
   ```bash
   roo script --file librechat.roo
   ```

2. **Development Mode**: Start embedded server
   ```roo
   web mvc embedded --port 3080
   ```

3. **Build**: Compile and package
   ```roo
   perform clean compile package
   ```

4. **Test**: Run all tests
   ```roo
   test integration
   selenium test
   ```

## Configuration Files

- `librechat.roo` - Main Roo script with all entity and service definitions
- `.roo` - Roo configuration and hints
- `roo-project.properties` - Project properties and configuration
- `roo-commands.md` - This file with command documentation

## Notes

- Roo commands create Spring Boot applications with similar architecture to LibreChat
- Entity JPA commands create domain objects similar to Mongoose models
- Web MVC controllers provide REST APIs similar to Express.js routes
- Security setup provides authentication similar to Passport.js
- Repository JPA creates data access layer similar to LibreChat's database operations
