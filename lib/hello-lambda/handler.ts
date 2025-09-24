/* This is for a LAMBDA-PROXY integration with API Gateway
export async function main() {
  return {
    body: JSON.stringify({message: 'Hello from Lambda 🎉'}),
    statusCode: 200,
  };
} */

// This is for a LAMBDA integration with API Gateway
export async function main(event: { message: any; }) {
  return {
    message: `SUCCESS with message ${event.message} 🎉`
  };
}