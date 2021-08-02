import { StackProps, Construct, CfnOutput } from '@aws-cdk/core';
import { PrerenderFunction } from './prerender-construct';
import { PrerenderCheckFunction } from './prerender-check-construct';

export interface PrerenderLambdaStack extends StackProps {
    redirectBackendOrigin: string,
    redirectFrontendHost: string,
    prerenderToken: string
}

export class PrerenderLambda extends Construct {
  constructor(scope: Construct, id: string, props: PrerenderLambdaStack) {
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
  }
}
