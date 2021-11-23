import { Construct, CfnOutput } from '@aws-cdk/core';
import { PrerenderFunction } from './prerender-construct';
import { PrerenderCheckFunction } from './prerender-check-construct';
import { ErrorResponseFunction } from './error-response-construct';

export interface PrerenderLambdaProps {
    frontendHost: string,
    prerenderToken: string
    exclusionExpression?: string
}

export class PrerenderLambda extends Construct {
  constructor(scope: Construct, id: string, props: PrerenderLambdaProps) {
    super(scope, id);

    const prerenderCheckFunction = new PrerenderCheckFunction(this, 'PrerenderViewerRequest');
    new CfnOutput(this, 'PrerenderCheckVersionARN', {
        description: 'PrerenderCheckVersionARN',
        value: prerenderCheckFunction.edgeFunction.currentVersion.edgeArn,
    });

    const prerenderFunction = new PrerenderFunction(this, 'PrerenderOriginRequest', props);
    new CfnOutput(this, 'PrerenderFunctionVersionARN', {
        description: 'PrerenderFunctionVersionARN',
        value: prerenderFunction.edgeFunction.currentVersion.edgeArn,
    });

    const errorResponseFunction = new ErrorResponseFunction(this, 'ErrorResponse', props);
    new CfnOutput(this, 'ErrorResponseVersionARN', {
        description: 'ErrorResponseVersionARN',
        value: errorResponseFunction.edgeFunction.currentVersion.edgeArn,
    });
  }
}
