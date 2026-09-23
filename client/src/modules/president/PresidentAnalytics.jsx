import { useEffect, useState } from 'react';
import { AnalyticsAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import DashboardHero from '../../components/common/DashboardHero';
import ClubAnalyticsPanel from '../../components/shared/ClubAnalyticsPanel';

const PresidentAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.club) { setLoading(false); return; }
    const clubId = user.club._id || user.club;
    AnalyticsAPI.club(clubId)
      .then((res) => setAnalytics(res.data.analytics))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Loader />;
  if (!user?.club) return <EmptyState title="No club assigned yet" subtitle="Ask the admin to assign you as president of a club." />;

  return (
    <div>
      <DashboardHero
        title="Club Analytics"
        subtitle={`Performance insights for ${analytics?.clubName || 'your club'}.`}
        chips={[`${analytics?.summary.attendanceRate ?? 0}% attendance rate`, `${analytics?.summary.totalEvents ?? 0} events tracked`]}
      />
      <ClubAnalyticsPanel analytics={analytics} />
    </div>
  );
};

export default PresidentAnalytics;
