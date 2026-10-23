import { Link } from 'react-router';
import { EmptyState, Page, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Page>
      <PageHeader title="Off the map" />
      <EmptyState
        title="Nothing parked here"
        actions={
          <Button asChild>
            <Link to="/">Back to the garage</Link>
          </Button>
        }
      >
        That page doesn't exist — maybe the bike was deleted.
      </EmptyState>
    </Page>
  );
}
