import { SynthUtils } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import * as cf from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as iam from '@aws-cdk/aws-iam';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

import * as extensions from '../extensions';

test('minimal usage', () => {
  // GIVEN
  const deliveryStreamName = 'test';
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'global-data-ingestion');

  // WHEN
  /**
   * Kinesis Firehose components
   */
  const firehoseRole = new iam.Role(stack, 'FirehoseRole', {
    assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
  });

  const firehoseDataBucket = new s3.Bucket(stack, 'FirehoseDataBucket', {
    autoDeleteObjects: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });
  firehoseDataBucket.grantReadWrite(firehoseRole);

  const firehoseStream = new firehose.CfnDeliveryStream(stack, 'FirehoseStream', {
    deliveryStreamName,
    deliveryStreamType: 'DirectPut',
    extendedS3DestinationConfiguration: {
      bucketArn: firehoseDataBucket.bucketArn,
      bufferingHints: {
        intervalInSeconds: 60,
        sizeInMBs: 5,
      },
      roleArn: firehoseRole.roleArn,
      errorOutputPrefix: 'error',
    },
  });

  /**
   * Cloudfront and Lambda@Edge
   */
  const ext = new extensions.GlobalDataIngestion(stack, 'GlobalDataIngestion', {
    firehoseStreamName: firehoseStream.deliveryStreamName!,
  });


  const dist = new cf.Distribution(stack, 'dist', {
    defaultBehavior: {
      allowedMethods: cf.AllowedMethods.ALLOW_ALL,
      origin: new origins.HttpOrigin('aws.amazon.com'),
      edgeLambdas: [ext],
    },
  });

  /**
   * Outputs
   */
  new cdk.CfnOutput(stack, 'distributionDomainName', {
    value: dist.distributionDomainName,
  });
  new cdk.CfnOutput(stack, 'firehoseStreamName', {
    value: firehoseStream.deliveryStreamName!,
  });
  new cdk.CfnOutput(stack, 'firehoseDataBucket', {
    value: firehoseDataBucket.bucketName,
  });

  // THEN
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();

  expect(stack).toHaveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      DefaultCacheBehavior: {
        AllowedMethods: [
          'GET',
          'HEAD',
          'OPTIONS',
          'PUT',
          'PATCH',
          'POST',
          'DELETE',
        ],
        LambdaFunctionAssociations: [
          {
            EventType: 'viewer-request',
            IncludeBody: true,
            LambdaFunctionARN: {
              Ref: 'GlobalDataIngestionFuncCurrentVersion202047488ec37521ae3a364cdfa9bde29d6c8bbf',
            },
          },
        ],
        ViewerProtocolPolicy: 'allow-all',
      },
    },
  });

});
