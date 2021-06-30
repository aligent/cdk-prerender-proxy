import { StackProps, Stack, Construct, CfnOutput } from '@aws-cdk/core';
import { PrerenderFunction } from './prerender-construct';
import { PrerenderCheckFunction } from './prerender-check-construct';

export interface PrerenderLambdaStackProps extends StackProps {
    redirectBackendOrigin: string,
    redirectFrontendHost: string,
    prerenderToken: string
}

export class PrerenderLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: PrerenderLambdaStackProps) {
    super(scope, id, props);

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