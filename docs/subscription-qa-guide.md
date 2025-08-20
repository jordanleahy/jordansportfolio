# Subscription Credit Update - QA Test Guide

This guide outlines how to test the end-to-end subscription flow and verify that credits update correctly in the top navigation.

## Enhanced Logging Implementation

### 1. Check-Subscription Edge Function Logging
The `check-subscription` function now includes comprehensive logging:
- **Request tracking**: Unique request IDs for correlation
- **Timing logs**: Performance monitoring for each operation
- **Database operations**: Before/after state logging for all DB changes
- **Stripe API calls**: Detailed logging of customer/subscription lookups
- **Tier matching**: Shows price ID matching with internal tiers
- **Error handling**: Stack traces and context for all failures

### 2. Frontend Component Logging
Enhanced logging in key components:
- **SubscriptionSuccess**: Sync process timing and results
- **useUsageSummary**: Query performance and data calculations
- **CreditStatus**: Real-time status updates and changes

## End-to-End QA Test Flow

### Test Setup
1. Open browser Developer Tools (F12)
2. Navigate to Console tab to monitor logs
3. Ensure you have access to Supabase dashboard for database monitoring

### Test 1: New Subscription Sign-Up
1. **Start**: Navigate to `/subscription` page
2. **Action**: Click "Subscribe" for Starter plan
3. **Monitor**: Console logs for subscription flow
4. **Complete**: Stripe checkout process
5. **Verify**: 
   - Check console for `[check-subscription]` logs
   - Verify credit status updates in top nav
   - Confirm subscription in Supabase `user_subscriptions` table

**Expected Console Output:**
```
[check-subscription:timestamp] REQUEST_START
[check-subscription:TIMING] AUTH_VALIDATION: XXXms
[check-subscription:timestamp] STRIPE_CUSTOMER_FOUND
[check-subscription:timestamp] STRIPE_SUBSCRIPTION_DETAILS
[check-subscription:timestamp] TIER_MATCHING
[check-subscription:DB] UPDATE_ACTIVE_SUBSCRIPTION
[check-subscription:timestamp] SUBSCRIPTION_SYNC_SUCCESS
[SubscriptionSuccess] Sync completed
[useUsageSummary] Query completed successfully
[CreditStatus] Status updated
```

### Test 2: Existing User Login
1. **Start**: Log out and log back in with subscribed user
2. **Monitor**: Automatic subscription check on login
3. **Verify**: Credits display correctly without manual sync

### Test 3: Subscription Cancellation
1. **Action**: Cancel subscription through Stripe portal
2. **Wait**: 5-10 minutes for webhook processing (if configured)
3. **Verify**: Credits update to show canceled status
4. **Test**: Manual refresh by calling check-subscription

### Test 4: Edge Cases
1. **Invalid Stripe Data**: Test with corrupted session
2. **Network Failures**: Disconnect during sync process  
3. **Database Conflicts**: Multiple rapid subscription changes
4. **Tier Mismatches**: Stripe price not found in database

## Monitoring Database State

### Key Tables to Monitor
```sql
-- User subscriptions
SELECT * FROM user_subscriptions WHERE user_id = 'USER_ID';

-- Subscription tiers and price mappings
SELECT * FROM subscription_tiers WHERE is_active = true;

-- API usage tracking
SELECT * FROM api_usage_tracking 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Real-time Monitoring
Set up Supabase real-time listeners to monitor changes:
```javascript
// Monitor subscription changes
supabase
  .channel('subscription-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_subscriptions'
  }, payload => console.log('DB Change:', payload))
  .subscribe();
```

## Performance Benchmarks

### Expected Timing Thresholds
- **AUTH_VALIDATION**: < 200ms
- **STRIPE_CUSTOMER_LOOKUP**: < 500ms
- **STRIPE_SUBSCRIPTION_LOOKUP**: < 500ms
- **DB_TIERS_LOOKUP**: < 100ms
- **DB_FINAL_OPERATION**: < 200ms
- **TOTAL_REQUEST**: < 1500ms

### React Query Performance
- **useUsageSummary**: < 300ms for cached data
- **Real-time updates**: < 2s from DB change to UI update

## Common Issues & Solutions

### Issue: Credits not updating after subscription
**Check:**
1. Console logs for request ID correlation
2. Network tab for failed API calls
3. Supabase `user_subscriptions` table for correct tier_id

### Issue: Slow credit updates
**Check:**
1. Performance timing logs
2. React Query cache staleness
3. Database query performance

### Issue: Tier mapping failures
**Check:**
1. `TIER_MATCHING` logs showing price ID comparison
2. `subscription_tiers` table for correct `stripe_price_id` values
3. Stripe dashboard for actual price IDs

## Debugging Commands

### Browser Console
```javascript
// Force subscription sync
supabase.functions.invoke('check-subscription')
  .then(result => console.log('Sync result:', result));

// Check current usage data
// (Access through React DevTools or global debug object)
```

### Supabase Edge Function Logs
Navigate to: `https://supabase.com/dashboard/project/{PROJECT_ID}/functions/check-subscription/logs`

## Success Criteria
✅ Subscription sync completes in < 1.5 seconds  
✅ Credits update in top nav within 5 seconds  
✅ All database operations logged with before/after states  
✅ Error scenarios properly logged and handled  
✅ React Query cache invalidation works correctly  
✅ Real-time updates trigger immediate UI refresh  

## Test Automation Ideas
1. **Cypress E2E tests** for subscription flow
2. **Unit tests** for credit calculation logic
3. **Integration tests** for Stripe webhook handling
4. **Performance tests** for subscription sync timing