import 'source-map-support/register';
import axios from "axios";
import { CloudFrontRequest, CloudFrontRequestEvent, CloudFrontResponse } from 'aws-lambda';
import { URL } from 'url';
import * as https from 'https';

const REDIRECT_BACKEND = process.env.REDIRECT_BACKEND;
const REDIRECT_FRONTEND_HOST = process.env.REDIRECT_FRONTEND_HOST;
const PRERENDER_TOKEN = process.env.PRERENDER_TOKEN;
const EXCLUSION_EXPRESSION = process.env.EXCLUSION_EXPRESSION;

// Create axios client outside of lambda function for re-use between calls
const instance = axios.create({
  timeout: 1000,
  // Don't follow redirects
  maxRedirects: 0,
  // Only valid response codes are redirects
  validateStatus: function (status) {
    return status == 301 || status == 302;
  },
  // keep connection alive so we don't constantly do SSL negotiation
  httpsAgent: new https.Agent({ keepAlive: true }),
});

export const handler = (event: CloudFrontRequestEvent): Promise<CloudFrontResponse|CloudFrontRequest> => {
  let request = event.Records[0].cf.request;

  if ((new RegExp(EXCLUSION_EXPRESSION)).test(request.uri)) {
    request.uri = '/index.html';
    return Promise.resolve(request);
  }

  // Make HEAD request to the Magento backend to see if there is a redirect for this path 
  return instance.head(request.uri, { baseURL: REDIRECT_BACKEND }).then((res) => {
    let location = new URL(res.headers.location);

    // if the host matches our magento backend replace it with the frontend url
    // this allows magento to perform full url redirects if needed.
    if (location.href.startsWith(REDIRECT_BACKEND)) {
      location.host = REDIRECT_FRONTEND_HOST;
    }

    return <CloudFrontResponse>{
        status: String(res.status),
        statusDescription: res.statusText,
        headers: {
          Location: [
            {
              value: location.href
            }
          ],
        }
    };
  }).catch((err) => {
    // An error is returned when any status code except a 301 or 302
    // fallback to normal prerender behavior

    // viewer-request function will determine whether we prerender or not
    // if we should we add prerender as our custom origin
    if (request.headers['x-request-prerender']) {
      // Cloudfront will alter the request for / to /index.html
      // since it is defined as the default root object
      // we do not want to do this when prerendering the homepage
      if (request.uri === "/index.html") {
           request.uri = '/';
      }

      request.origin = {
          custom: {
              domainName: 'service.prerender.io',
              port: 443,
              protocol: 'https',
              readTimeout: 20,
              keepaliveTimeout: 5,
              sslProtocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
              path: '/https%3A%2F%2F' + request.headers['x-prerender-host'][0].value,
              customHeaders: {
                'x-prerender-token': [{
                  key: 'x-prerender-token',
                  value: PRERENDER_TOKEN
                }]
              }
          }
      };
   } else {
     request.uri = '/index.html';
   }

   return request;
  });
}
