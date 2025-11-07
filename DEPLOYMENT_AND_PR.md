# Deployment Instructions

## Prerequisites
- AWS CLI configured
- AWS CDK installed
- `.env` file present in the project root with credentials (e.g., `LucasSlz=TEST_PASSWORD`)

## Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Bootstrap CDK (if not done before):
   ```bash
   npx cdk bootstrap
   ```
3. Deploy all stacks:
   ```bash
   npx cdk deploy --all
   ```
   Or deploy specific stacks:
   ```bash
   npx cdk deploy AuthorizationServiceStack ImportServiceStack ProductServiceStack
   ```
4. Ensure `.env` is not committed to version control (already in `.gitignore`).

---

# What Was Done in This Session

- Created a new `authorization-service` with a Lambda function `basicAuthorizer`.
- Added `.env` file support for credentials and updated `.gitignore`.
- Implemented `basicAuthorizer` to decode Basic Auth, check credentials, and return 401/403 as required.
- Created a CDK stack for `authorization-service`.
- Updated `import-service` CDK stack to use the Lambda authorizer for the `/import` path.
- Ensured client requests to `/import` require a valid Basic Authorization header, with the token retrieved from browser localStorage.
- Fixed CDK type errors and validated configuration.

---

# PR Message & Acceptance Criteria

## PR Message
This PR adds a new `authorization-service` with a Lambda authorizer for the Import Service API Gateway. The Import Service `/import` endpoint now requires Basic Authorization, validated by the new Lambda. Credentials are managed via a `.env` file, which is excluded from version control. The client application is updated to send the required Authorization header.

## Acceptance Criteria Fulfillment
- **authorization-service is added to the repo, has correct basicAuthorizer lambda and correct CDK file:**
  - New service and Lambda created, CDK stack implemented.
- **Import Service CDK file has authorizer configuration for the importProductsFile lambda:**
  - API Gateway `/import` path uses Lambda authorizer, only allows requests with valid credentials, returns 401/403 as required.
- **Client application is updated to send "Authorization: Basic authorization_token" header on import:**
  - Client code retrieves token from localStorage and sends it in the header.

All acceptance criteria are fulfilled.
