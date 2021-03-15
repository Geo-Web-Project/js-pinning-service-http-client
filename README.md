# js-pinning-service-http-client

An IPFS Pinning Service HTTP Client

> This repo contains an implementation of a client for the [IPFS Pinning Services API Spec](https://github.com/ipfs/pinning-services-api-spec)

This client uses the [typescript-axios](https://openapi-generator.tech/docs/generators/typescript-axios) OpenAPI generator.

## Example Usage

See [example](./example.js).

```javascript
    const JsPinningServiceHttpClient = require("./openapi/dist");

    // Pinata Pinning Services API: https://pinata.cloud/documentation#PinningServicesAPI
    // Set env var ACCESS_TOKEN
    const client = JsPinningServiceHttpClient.PinsApiFactory({
        basePath: "https://api.pinata.cloud/psa",
        accessToken: process.env.ACCESS_TOKEN,
    });

    let result = await client.pinsGet();
    console.log(result.data);
```

## Updating Pinning Service Spec

The client can be updated with the latest spec by running:

```
npx @openapitools/openapi-generator-cli generate -i https://raw.githubusercontent.com/ipfs/pinning-services-api-spec/master/ipfs-pinning-service.yaml -g typescript-axios -o ./openapi -c config.json
```

There may be some type issues in `PinsApiAxiosParamCreator.pinsGet` that requires manual changes.