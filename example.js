// Simple example of using the generated client

const JsPinningServiceHttpClient = require("./openapi/dist");

// Pinata Pinning Services API: https://pinata.cloud/documentation#PinningServicesAPI
// Set env var ACCESS_TOKEN
const client = JsPinningServiceHttpClient.PinsApiFactory({
  basePath: "https://api.pinata.cloud/psa",
  accessToken: process.env.ACCESS_TOKEN,
});

async function run() {
  let result = await client.pinsGet();
  console.log(result.data);
}

run();
