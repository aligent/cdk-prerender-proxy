import { StackProps, Stack, Construct, CfnOutput } from '@aws-cdk/core';
import { Bundling } from '@aws-cdk/aws-lambda-nodejs/lib/bundling';
import { Runtime } from '@aws-cdk/aws-lambda';
import { experimental } from '@aws-cdk/aws-cloudfront';

export interface PrerenderLambdaStackProps extends StackProps {
    redirectBackendOrigin: string,
    redirectFrontendHost: string,
    prerenderToken: string
}

export class PrerenderLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: PrerenderLambdaStackProps) {
    super(scope, id, props);

    const redirectFunction = new experimental.EdgeFunction(
      this,
      'PrerenderFunction',
      {
        code: Bundling.bundle({
          entry: `${__dirname}/handlers/prerender.ts`,
          runtime: Runtime.NODEJS_12_X,
          depsLockFilePath: `${__dirname}/handlers/package-lock.json`,
          // Define options replace values at build time so we can use environment variables to test locally
          // and replace during build/deploy with static values. This gets around the lambda@edge limitation
          // of no environment variables at runtime.
          define: {
            'process.env.REDIRECT_BACKEND': JSON.stringify(props.redirectBackendOrigin),
            'process.env.REDIRECT_FRONTEND_HOST': JSON.stringify(props.redirectFrontendHost),
            'process.env.PRERENDER_TOKEN': JSON.stringify(props.prerenderToken)
          }
        }),
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.handler',
      }
    )

    new CfnOutput(this, 'PrerenderFunctionVersionARN', {
        description: 'PrerenderFunctionVersionARN',
        value: redirectFunction.currentVersion.edgeArn,
    });

    const prerenderCheckFunction = new experimental.EdgeFunction(
      this,
      'PrerenderCheckFunction',
      {
        code: Bundling.bundle({
          entry: `${__dirname}/handlers/prerender-check.ts`,
          runtime: Runtime.NODEJS_12_X,
          depsLockFilePath: `${__dirname}/handlers/package-lock.json`
        }),
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.handler',
      }
    )

    new CfnOutput(this, 'PrerenderCheckVersionARN', {
        description: 'PrerenderCheckVersionARN',
        value: prerenderCheckFunction.currentVersion.edgeArn,
    });
  }
}