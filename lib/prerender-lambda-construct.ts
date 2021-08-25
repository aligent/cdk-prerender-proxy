import { Construct, CfnOutput } from '@aws-cdk/core';
import { PrerenderFunction } from './prerender-construct';
import { PrerenderCheckFunction } from './prerender-check-construct';
import { ErrorResponseFunction } from './error-response-construct';

export interface PrerenderLambdaProps {
    redirectBackendOrigin: string,
    redirectFrontendHost: string,
    prerenderToken: string
}

export class PrerenderLambda extends Construct {
  constructor(scope: Construct, id: string, props: PrerenderLambdaProps) {
    super(scope, id);

    const prerenderCheckFunction = new PrerenderCheckFunction(this, 'PrerenderViewerRequest');
    new CfnOutput(this, 'PrerenderCheckVersionARN', {
        description: 'PrerenderCheckVersionARN',
        value: prerenderCheckFunction.edgeFunction.currentVersion.edgeArn,
    });

    const redirectFunction = new PrerenderFunction(this, 'PrerenderOriginRequest', props);
    new CfnOutput(this, 'PrerenderFunctionVersionARN', {
        description: 'PrerenderFunctionVersionARN',
        value: redirectFunction.edgeFunction.currentVersion.edgeArn,
    });

    const errorResponseFunction = new ErrorResponseFunction(this, 'ErrorResponse', props);
    new CfnOutput(this, 'ErrorResponseVersionARN', {
        description: 'ErrorResponseVersionARN',
        value: errorResponseFunction.edgeFunction.currentVersion.edgeArn,
    });
  }
}
