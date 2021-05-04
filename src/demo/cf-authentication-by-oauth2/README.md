# Highlights

- Using OAuth 2.0 - Authorization Code Grant type to protect private content.
- Using Lambda@Edge Viewer request trigger.
- More details at this blog post by AWS Community Hero - Ernest:
  - (en) [Using AWS CDK to Deploy Static Website ft. OAuth 2.0 Authorization Code](https://www.ernestchiang.com/en/posts/2021/implementing-cloudfront-lambda-at-edge-oauth2-by-cdk/)
  - (zh) [使用 AWS CDK 快速部署靜態網站，搭配 CloudFront Lambda@Edge 擴充 OAuth 2.0 Authorization Code 授權流程](https://www.ernestchiang.com/zh/posts/2021/implementing-cloudfront-lambda-at-edge-oauth2-by-cdk/)

# Demo

## Work with Auth0

![](https://www.ernestchiang.com/img/2021/2021-04-13-implementing-cloudfront-lambda-at-edge-oauth2/Cloudfront-extension-OAuth2-demo-medium.gif)

## Work with KeyCloak

![](https://www.ernestchiang.com/img/2021/2021-04-13-implementing-cloudfront-lambda-at-edge-oauth2/CloudFront-plus-Oauth2-KeyCloak-demo.gif)
# Getting Started

## Step 1: Setup at your identity provider

Usually you will setup one application or client at your identity provider (IdP). You will need the information for the next step. Make sure you configure it to go via [Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/) grant type. (We are not using Authorization Code with PKCE in this demo.)

### Example: Auth0

- Application Type: **Regular Web Application**
- Token Endpoint Authentication Method: **None**
- Allowed Callback URLs: **https://abcabcabcabcab.cloudfront.net/callback**
- Allowed Web Origins: **https://abcabcabcabcab.cloudfront.net**
- Get your public key at Advanced Settings --> Certificates tab --> Signing Certificate.

### Example: KeyCloak

Detailed KeyCloak configuration screenshots describes in this blog post:

- (en) [Using AWS CDK to Deploy Static Website ft. OAuth 2.0 Authorization Code](https://www.ernestchiang.com/en/posts/2021/implementing-cloudfront-lambda-at-edge-oauth2-by-cdk/)
- (zh) [使用 AWS CDK 快速部署靜態網站，搭配 CloudFront Lambda@Edge 擴充 OAuth 2.0 Authorization Code 授權流程](https://www.ernestchiang.com/zh/posts/2021/implementing-cloudfront-lambda-at-edge-oauth2-by-cdk/)
## Step 2: duplicate & edit .env

Please make a copy from `dotenv/cf-authentication-by-oauth2/.env-example` to `dotenv/cf-authentication-by-oauth2/.env`, then edit `.env`. Place all the parameters and information from your identity provider (IdP).

```sh
cp dotenv/cf-authentication-by-oauth2/.env-example dotenv/cf-authentication-by-oauth2/.env
```

## Step 3: deployment

Open two terminals. One for yarn watch, and the other for cdk.

On the first terminal:

```sh
yarn install

cd lambda-assets/extensions/cf-authentication-by-oauth2

yarn install

cd ../../..

yarn watch
```

On the second terminal:

```sh
AWS_REGION=us-east-1 cdk --app lib/demo/cf-authentication-by-oauth2/index.js bootstrap

AWS_REGION=us-east-1 cdk --app lib/demo/cf-authentication-by-oauth2/index.js diff

AWS_REGION=us-east-1 cdk --app lib/demo/cf-authentication-by-oauth2/index.js deploy
```

## Step 4: Setup callback URL at your Identity Provider (IdP)

Once you deploy successfully, the CDK script will output a CloudFront distribution endpoint URL. Please combine with the callback path you assigned in the `.env` file to configurate callback URL at your IdP application/client setting.

## Step 5: Login

On deploy completed, open the CloudFront URL with

```
https://<CLOUDFRONT_DOMAIN>
```

You should be redirect to the authroization page of your assigned identity provider. Enter your credentials.

## Step 6: Enjoy the private content

Once you login successfully, you will be redirect to the S3 origin and see this demo page:

```
Hello CloudFront Extension with CDK!!!
You have logged in. Enjoy your private content.
```

Enjoy!