# Scheduled Aggregation Function

This Edge Function runs on a cron schedule to automatically fetch news articles at regular intervals.

## Functionality

- Runs every 15 minutes via a cron job
- Calls the `aggregate-news` function to fetch general news
- Calls the `fetch-crypto-news` function to fetch crypto news
- Updates the `system_settings` table with results and next scheduled run
- Creates log entries in the `aggregation_logs` table

## Cron Schedule

The function is configured to run every 15 minutes using the pattern:
```
*/15 * * * *
```

This is set up automatically via the GitHub Actions workflow.

## Manual Testing

You can test this function without waiting for the schedule by using the Admin Dashboard's "Test Scheduled Function" button.