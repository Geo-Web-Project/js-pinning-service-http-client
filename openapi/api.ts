/* tslint:disable */
/* eslint-disable */
/**
 * IPFS Pinning Service API
 *   ## About this spec The IPFS Pinning Service API is intended to be an implementation-agnostic API&#x3a; - For use and implementation by pinning service providers - For use in client mode by IPFS nodes and GUI-based applications  > **Note**: while ready for implementation, this spec is still a work in progress! 🏗️  **Your input and feedback are welcome and valuable as we develop this API spec. Please join the design discussion at [github.com/ipfs/pinning-services-api-spec](https://github.com/ipfs/pinning-services-api-spec).**  # Schemas This section describes the most important object types and conventions.  A full list of fields and schemas can be found in the `schemas` section of the [YAML file](https://github.com/ipfs/pinning-services-api-spec/blob/master/ipfs-pinning-service.yaml).  ## Identifiers ### cid [Content Identifier (CID)](https://docs.ipfs.io/concepts/content-addressing/) points at the root of a DAG that is pinned recursively. ### requestid Unique identifier of a pin request.  When a pin is created, the service responds with unique `requestid` that can be later used for pin removal. When the same `cid` is pinned again, a different `requestid` is returned to differentiate between those pin requests.  Service implementation should use UUID, `hash(accessToken,Pin,PinStatus.created)`, or any other opaque identifier that provides equally strong protection against race conditions.  ## Objects ### Pin object  ![pin object](https://bafybeideck2fchyxna4wqwc2mo67yriokehw3yujboc5redjdaajrk2fjq.ipfs.dweb.link/pin.png)  The `Pin` object is a representation of a pin request.  It includes the `cid` of data to be pinned, as well as optional metadata in `name`, `origins`, and `meta`.  ### Pin status response  ![pin status response object](https://bafybeideck2fchyxna4wqwc2mo67yriokehw3yujboc5redjdaajrk2fjq.ipfs.dweb.link/pinstatus.png)  The `PinStatus` object is a representation of the current state of a pinning operation. It includes the original `pin` object, along with the current `status` and globally unique `requestid` of the entire pinning request, which can be used for future status checks and management. Addresses in the `delegates` array are peers delegated by the pinning service for facilitating direct file transfers (more details in the provider hints section). Any additional vendor-specific information is returned in optional `info`.  # The pin lifecycle  ![pinning service objects and lifecycle](https://bafybeideck2fchyxna4wqwc2mo67yriokehw3yujboc5redjdaajrk2fjq.ipfs.dweb.link/lifecycle.png)  ## Creating a new pin object The user sends a `Pin` object to `POST /pins` and receives a `PinStatus` response: - `requestid` in `PinStatus` is the identifier of the pin operation, which can can be used for checking status, and removing the pin in the future - `status` in `PinStatus` indicates the current state of a pin  ## Checking status of in-progress pinning `status` (in `PinStatus`) may indicate a pending state (`queued` or `pinning`). This means the data behind `Pin.cid` was not found on the pinning service and is being fetched from the IPFS network at large, which may take time.  In this case, the user can periodically check pinning progress via `GET /pins/{requestid}` until pinning is successful, or the user decides to remove the pending pin.  ## Replacing an existing pin object The user can replace an existing pin object via `POST /pins/{requestid}`. This is a shortcut for removing a pin object identified by `requestid` and creating a new one in a single API call that protects against undesired garbage collection of blocks common to both pins. Useful when updating a pin representing a huge dataset where most of blocks did not change. The new pin object `requestid` is returned in the `PinStatus` response. The old pin object is deleted automatically.  ## Removing a pin object A pin object can be removed via `DELETE /pins/{requestid}`.   # Provider hints A pinning service will use the DHT and other discovery methods to locate pinned content; however, it is a good practice to provide additional provider hints to speed up the discovery phase and start the transfer immediately, especially if a client has the data in their own datastore or already knows of other providers.  The most common scenario is a client putting its own IPFS node\'s multiaddrs in `Pin.origins`,  and then attempt to connect to every multiaddr returned by a pinning service in `PinStatus.delegates` to initiate transfer.  At the same time, a pinning service will try to connect to multiaddrs provided by the client in `Pin.origins`.  This ensures data transfer starts immediately (without waiting for provider discovery over DHT), and mutual direct dial between a client and a service works around peer routing issues in restrictive network topologies, such as NATs, firewalls, etc.  **NOTE:** Connections to multiaddrs in `origins` and `delegates` arrays should be attempted in best-effort fashion, and dial failure should not fail the pinning operation. When unable to act on explicit provider hints, DHT and other discovery methods should be used as a fallback by a pinning service.  **NOTE:** All multiaddrs MUST end with `/p2p/{peerID}` and SHOULD be fully resolved and confirmed to be dialable from the public internet. Avoid sending addresses from local networks.  # Custom metadata Pinning services are encouraged to add support for additional features by leveraging the optional `Pin.meta` and `PinStatus.info` fields. While these attributes can be application- or vendor-specific, we encourage the community at large to leverage these attributes as a sandbox to come up with conventions that could become part of future revisions of this API. ## Pin metadata String keys and values passed in `Pin.meta` are persisted with the pin object.  Potential uses: - `Pin.meta[app_id]`: Attaching a unique identifier to pins created by an app enables filtering pins per app via `?meta={\"app_id\":<UUID>}` - `Pin.meta[vendor_policy]`: Vendor-specific policy (for example: which region to use, how many copies to keep)  Note that it is OK for a client to omit or ignore these optional attributes; doing so should not impact the basic pinning functionality.  ## Pin status info Additional `PinStatus.info` can be returned by pinning service.  Potential uses: - `PinStatus.info[status_details]`: more info about the current status (queue position, percentage of transferred data, summary of where data is stored, etc); when `PinStatus.status=failed`, it could provide a reason why a pin operation failed (e.g. lack of funds, DAG too big, etc.) - `PinStatus.info[dag_size]`: the size of pinned data, along with DAG overhead - `PinStatus.info[raw_size]`: the size of data without DAG overhead (eg. unixfs) - `PinStatus.info[pinned_until]`: if vendor supports time-bound pins, this could indicate when the pin will expire  # Pagination and filtering Pin objects can be listed by executing `GET /pins` with optional parameters:  - When no filters are provided, the endpoint will return a small batch of the 10 most recently created items, from the latest to the oldest. - The number of returned items can be adjusted with the `limit` parameter (implicit default is 10). - If the value in `PinResults.count` is bigger than the length of `PinResults.results`, the client can infer there are more results that can be queried. - To read more items, pass the `before` filter with the timestamp from `PinStatus.created` found in the oldest item in the current batch of results. Repeat to read all results. - Returned results can be fine-tuned by applying optional `after`, `cid`, `name`, `status`, or `meta` filters.  > **Note**: pagination by the `created` timestamp requires each value to be globally unique. Any future considerations to add support for bulk creation must account for this.  
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import { Configuration } from './configuration';
import globalAxios, { AxiosPromise, AxiosInstance } from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from './base';

/**
 * Response for a failed request
 * @export
 * @interface Failure
 */
export interface Failure {
    /**
     * 
     * @type {FailureError}
     * @memberof Failure
     */
    error: FailureError;
}
/**
 * 
 * @export
 * @interface FailureError
 */
export interface FailureError {
    /**
     * Mandatory string identifying the type of error
     * @type {string}
     * @memberof FailureError
     */
    reason: string;
    /**
     * Optional, longer description of the error; may include UUID of transaction for support, links to documentation etc
     * @type {string}
     * @memberof FailureError
     */
    details?: string;
}
/**
 * Pin object
 * @export
 * @interface Pin
 */
export interface Pin {
    /**
     * Content Identifier (CID) to be pinned recursively
     * @type {string}
     * @memberof Pin
     */
    cid: string;
    /**
     * Optional name for pinned data; can be used for lookups later
     * @type {string}
     * @memberof Pin
     */
    name?: string;
    /**
     * Optional list of multiaddrs known to provide the data
     * @type {Set<string>}
     * @memberof Pin
     */
    origins?: Set<string>;
    /**
     * Optional metadata for pin object
     * @type {{ [key: string]: string; }}
     * @memberof Pin
     */
    meta?: { [key: string]: string; };
}
/**
 * Response used for listing pin objects matching request
 * @export
 * @interface PinResults
 */
export interface PinResults {
    /**
     * The total number of pin objects that exist for passed query filters
     * @type {number}
     * @memberof PinResults
     */
    count: number;
    /**
     * An array of PinStatus results
     * @type {Set<PinStatus>}
     * @memberof PinResults
     */
    results: Set<PinStatus>;
}
/**
 * Pin object with status
 * @export
 * @interface PinStatus
 */
export interface PinStatus {
    /**
     * Globally unique identifier of the pin request; can be used to check the status of ongoing pinning, or pin removal
     * @type {string}
     * @memberof PinStatus
     */
    requestid: string;
    /**
     * 
     * @type {Status}
     * @memberof PinStatus
     */
    status: Status;
    /**
     * Immutable timestamp indicating when a pin request entered a pinning service; can be used for filtering results and pagination
     * @type {string}
     * @memberof PinStatus
     */
    created: string;
    /**
     * 
     * @type {Pin}
     * @memberof PinStatus
     */
    pin: Pin;
    /**
     * List of multiaddrs designated by pinning service for transferring any new data from external peers
     * @type {Set<string>}
     * @memberof PinStatus
     */
    delegates: Set<string>;
    /**
     * Optional info for PinStatus response
     * @type {{ [key: string]: string; }}
     * @memberof PinStatus
     */
    info?: { [key: string]: string; };
}
/**
 * Status a pin object can have at a pinning service
 * @export
 * @enum {string}
 */
export enum Status {
    Queued = 'queued',
    Pinning = 'pinning',
    Pinned = 'pinned',
    Failed = 'failed'
}

/**
 * Alternative text matching strategy
 * @export
 * @enum {string}
 */
export enum TextMatchingStrategy {
    Exact = 'exact',
    Iexact = 'iexact',
    Partial = 'partial',
    Ipartial = 'ipartial'
}


/**
 * PinsApi - axios parameter creator
 * @export
 */
export const PinsApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * List all the pin objects, matching optional filters; when no filter is provided, only successful pins are returned
         * @summary List pin objects
         * @param {Set<string>} [cid] Return pin objects responsible for pinning the specified CID(s); be aware that using longer hash functions introduces further constraints on the number of CIDs that will fit under the limit of 2000 characters per URL  in browser contexts
         * @param {string} [name] Return pin objects with specified name (by default a case-sensitive, exact match)
         * @param {TextMatchingStrategy} [match] Customize the text matching strategy applied when name filter is present
         * @param {Set<Status>} [status] Return pin objects for pins with the specified status
         * @param {string} [before] Return results created (queued) before provided timestamp
         * @param {string} [after] Return results created (queued) after provided timestamp
         * @param {number} [limit] Max records to return
         * @param {{ [key: string]: string; }} [meta] Return pin objects that match specified metadata
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsGet: async (cid?: Set<string>, name?: string, match?: TextMatchingStrategy, status?: Set<Status>, before?: string, after?: string, limit?: number, meta?: { [key: string]: string; }, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/pins`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication accessToken required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (cid) {
                localVarQueryParameter['cid'] = Array.from(cid.values()).join(COLLECTION_FORMATS.csv);
            }

            if (name !== undefined) {
                localVarQueryParameter['name'] = name;
            }

            if (match !== undefined) {
                localVarQueryParameter['match'] = match;
            }

            if (status) {
                localVarQueryParameter['status'] = Array.from(status.values()).join(COLLECTION_FORMATS.csv);
            }

            if (before !== undefined) {
                localVarQueryParameter['before'] = (before as any instanceof Date) ?
                    (before as any).toISOString() :
                    before;
            }

            if (after !== undefined) {
                localVarQueryParameter['after'] = (after as any instanceof Date) ?
                    (after as any).toISOString() :
                    after;
            }

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (meta !== undefined) {
                localVarQueryParameter['meta'] = meta;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Add a new pin object for the current access token
         * @summary Add pin object
         * @param {Pin} pin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsPost: async (pin: Pin, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'pin' is not null or undefined
            assertParamExists('pinsPost', 'pin', pin)
            const localVarPath = `/pins`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication accessToken required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(pin, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Remove a pin object
         * @summary Remove pin object
         * @param {string} requestid 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsRequestidDelete: async (requestid: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'requestid' is not null or undefined
            assertParamExists('pinsRequestidDelete', 'requestid', requestid)
            const localVarPath = `/pins/{requestid}`
                .replace(`{${"requestid"}}`, encodeURIComponent(String(requestid)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication accessToken required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get a pin object and its status
         * @summary Get pin object
         * @param {string} requestid 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsRequestidGet: async (requestid: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'requestid' is not null or undefined
            assertParamExists('pinsRequestidGet', 'requestid', requestid)
            const localVarPath = `/pins/{requestid}`
                .replace(`{${"requestid"}}`, encodeURIComponent(String(requestid)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication accessToken required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Replace an existing pin object (shortcut for executing remove and add operations in one step to avoid unnecessary garbage collection of blocks present in both recursive pins)
         * @summary Replace pin object
         * @param {string} requestid 
         * @param {Pin} pin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsRequestidPost: async (requestid: string, pin: Pin, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'requestid' is not null or undefined
            assertParamExists('pinsRequestidPost', 'requestid', requestid)
            // verify required parameter 'pin' is not null or undefined
            assertParamExists('pinsRequestidPost', 'pin', pin)
            const localVarPath = `/pins/{requestid}`
                .replace(`{${"requestid"}}`, encodeURIComponent(String(requestid)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication accessToken required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(pin, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * PinsApi - functional programming interface
 * @export
 */
export const PinsApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = PinsApiAxiosParamCreator(configuration)
    return {
        /**
         * List all the pin objects, matching optional filters; when no filter is provided, only successful pins are returned
         * @summary List pin objects
         * @param {Set<string>} [cid] Return pin objects responsible for pinning the specified CID(s); be aware that using longer hash functions introduces further constraints on the number of CIDs that will fit under the limit of 2000 characters per URL  in browser contexts
         * @param {string} [name] Return pin objects with specified name (by default a case-sensitive, exact match)
         * @param {TextMatchingStrategy} [match] Customize the text matching strategy applied when name filter is present
         * @param {Set<Status>} [status] Return pin objects for pins with the specified status
         * @param {string} [before] Return results created (queued) before provided timestamp
         * @param {string} [after] Return results created (queued) after provided timestamp
         * @param {number} [limit] Max records to return
         * @param {{ [key: string]: string; }} [meta] Return pin objects that match specified metadata
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pinsGet(cid?: Set<string>, name?: string, match?: TextMatchingStrategy, status?: Set<Status>, before?: string, after?: string, limit?: number, meta?: { [key: string]: string; }, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PinResults>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pinsGet(cid, name, match, status, before, after, limit, meta, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Add a new pin object for the current access token
         * @summary Add pin object
         * @param {Pin} pin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pinsPost(pin: Pin, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PinStatus>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pinsPost(pin, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Remove a pin object
         * @summary Remove pin object
         * @param {string} requestid 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pinsRequestidDelete(requestid: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pinsRequestidDelete(requestid, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Get a pin object and its status
         * @summary Get pin object
         * @param {string} requestid 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pinsRequestidGet(requestid: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PinStatus>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pinsRequestidGet(requestid, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Replace an existing pin object (shortcut for executing remove and add operations in one step to avoid unnecessary garbage collection of blocks present in both recursive pins)
         * @summary Replace pin object
         * @param {string} requestid 
         * @param {Pin} pin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pinsRequestidPost(requestid: string, pin: Pin, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PinStatus>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pinsRequestidPost(requestid, pin, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * PinsApi - factory interface
 * @export
 */
export const PinsApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = PinsApiFp(configuration)
    return {
        /**
         * List all the pin objects, matching optional filters; when no filter is provided, only successful pins are returned
         * @summary List pin objects
         * @param {Set<string>} [cid] Return pin objects responsible for pinning the specified CID(s); be aware that using longer hash functions introduces further constraints on the number of CIDs that will fit under the limit of 2000 characters per URL  in browser contexts
         * @param {string} [name] Return pin objects with specified name (by default a case-sensitive, exact match)
         * @param {TextMatchingStrategy} [match] Customize the text matching strategy applied when name filter is present
         * @param {Set<Status>} [status] Return pin objects for pins with the specified status
         * @param {string} [before] Return results created (queued) before provided timestamp
         * @param {string} [after] Return results created (queued) after provided timestamp
         * @param {number} [limit] Max records to return
         * @param {{ [key: string]: string; }} [meta] Return pin objects that match specified metadata
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsGet(cid?: Set<string>, name?: string, match?: TextMatchingStrategy, status?: Set<Status>, before?: string, after?: string, limit?: number, meta?: { [key: string]: string; }, options?: any): AxiosPromise<PinResults> {
            return localVarFp.pinsGet(cid, name, match, status, before, after, limit, meta, options).then((request) => request(axios, basePath));
        },
        /**
         * Add a new pin object for the current access token
         * @summary Add pin object
         * @param {Pin} pin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsPost(pin: Pin, options?: any): AxiosPromise<PinStatus> {
            return localVarFp.pinsPost(pin, options).then((request) => request(axios, basePath));
        },
        /**
         * Remove a pin object
         * @summary Remove pin object
         * @param {string} requestid 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsRequestidDelete(requestid: string, options?: any): AxiosPromise<void> {
            return localVarFp.pinsRequestidDelete(requestid, options).then((request) => request(axios, basePath));
        },
        /**
         * Get a pin object and its status
         * @summary Get pin object
         * @param {string} requestid 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsRequestidGet(requestid: string, options?: any): AxiosPromise<PinStatus> {
            return localVarFp.pinsRequestidGet(requestid, options).then((request) => request(axios, basePath));
        },
        /**
         * Replace an existing pin object (shortcut for executing remove and add operations in one step to avoid unnecessary garbage collection of blocks present in both recursive pins)
         * @summary Replace pin object
         * @param {string} requestid 
         * @param {Pin} pin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pinsRequestidPost(requestid: string, pin: Pin, options?: any): AxiosPromise<PinStatus> {
            return localVarFp.pinsRequestidPost(requestid, pin, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * PinsApi - object-oriented interface
 * @export
 * @class PinsApi
 * @extends {BaseAPI}
 */
export class PinsApi extends BaseAPI {
    /**
     * List all the pin objects, matching optional filters; when no filter is provided, only successful pins are returned
     * @summary List pin objects
     * @param {Set<string>} [cid] Return pin objects responsible for pinning the specified CID(s); be aware that using longer hash functions introduces further constraints on the number of CIDs that will fit under the limit of 2000 characters per URL  in browser contexts
     * @param {string} [name] Return pin objects with specified name (by default a case-sensitive, exact match)
     * @param {TextMatchingStrategy} [match] Customize the text matching strategy applied when name filter is present
     * @param {Set<Status>} [status] Return pin objects for pins with the specified status
     * @param {string} [before] Return results created (queued) before provided timestamp
     * @param {string} [after] Return results created (queued) after provided timestamp
     * @param {number} [limit] Max records to return
     * @param {{ [key: string]: string; }} [meta] Return pin objects that match specified metadata
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PinsApi
     */
    public pinsGet(cid?: Set<string>, name?: string, match?: TextMatchingStrategy, status?: Set<Status>, before?: string, after?: string, limit?: number, meta?: { [key: string]: string; }, options?: any) {
        return PinsApiFp(this.configuration).pinsGet(cid, name, match, status, before, after, limit, meta, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Add a new pin object for the current access token
     * @summary Add pin object
     * @param {Pin} pin 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PinsApi
     */
    public pinsPost(pin: Pin, options?: any) {
        return PinsApiFp(this.configuration).pinsPost(pin, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Remove a pin object
     * @summary Remove pin object
     * @param {string} requestid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PinsApi
     */
    public pinsRequestidDelete(requestid: string, options?: any) {
        return PinsApiFp(this.configuration).pinsRequestidDelete(requestid, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get a pin object and its status
     * @summary Get pin object
     * @param {string} requestid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PinsApi
     */
    public pinsRequestidGet(requestid: string, options?: any) {
        return PinsApiFp(this.configuration).pinsRequestidGet(requestid, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Replace an existing pin object (shortcut for executing remove and add operations in one step to avoid unnecessary garbage collection of blocks present in both recursive pins)
     * @summary Replace pin object
     * @param {string} requestid 
     * @param {Pin} pin 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PinsApi
     */
    public pinsRequestidPost(requestid: string, pin: Pin, options?: any) {
        return PinsApiFp(this.configuration).pinsRequestidPost(requestid, pin, options).then((request) => request(this.axios, this.basePath));
    }
}


