-- Add unique constraint on endpoint for upsert to work
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- Also add a policy to allow service role to insert/read for push notifications
CREATE POLICY "Service role can manage subscriptions" 
ON public.push_subscriptions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);