import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FeatureFlagTest = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature flags are configured via environment variables.
          </p>
          <div className="mt-4 space-y-2">
            <p><strong>GraphQL Services:</strong> All enabled (migration complete)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagTest;
