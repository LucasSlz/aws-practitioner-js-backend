import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  if (!event.authorizationToken) {
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: event.methodArn,
        }],
      },
      context: { statusCode: 401, message: 'No authorization header provided' },
    };
  }

  const token = event.authorizationToken.split(' ')[1];
  if (!token) {
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: event.methodArn,
        }],
      },
      context: { statusCode: 401, message: 'Malformed authorization header' },
    };
  }

  const credentials = Buffer.from(token, 'base64').toString('utf-8').split(':');
  const [login, password] = credentials;
  const expectedPassword = process.env[login];

  if (!expectedPassword || expectedPassword !== password) {
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: event.methodArn,
        }],
      },
      context: { statusCode: 403, message: 'Invalid credentials' },
    };
  }

  return {
    principalId: login,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: event.methodArn,
      }],
    },
    context: { statusCode: 200, message: 'Authorized' },
  };
};
