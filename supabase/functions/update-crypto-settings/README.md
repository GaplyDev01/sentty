# Update Crypto Settings Edge Function

This edge function updates the system settings to enable crypto news integrations:
- CryptoPanic API
- FireCrawl API
- CoinDesk API

## What it does

The function:
1. Updates the `system_settings` table to enable all crypto news integrations
2. Sets the API keys for each integration
3. Creates a log entry tracking the update

## How to use

Call this function from the admin dashboard to activate all crypto news integrations immediately.

The function accepts no parameters as the API keys are hardcoded in the function for immediate deployment.

## Response

The function returns a JSON object with the status of each integration:

```json
{
  "message": "Successfully enabled all crypto news integrations",
  "cryptoPanic": {
    "enabled": true,
    "api_key_set": true
  },
  "fireCrawl": {
    "enabled": true,
    "api_key_set": true
  },
  "coinDesk": {
    "enabled": true,
    "api_key_set": true
  }
}
```

## Error Handling

If the update fails, the function returns a 500 status code with an error message.