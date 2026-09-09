import NotificationManager from '../../components/shared/NotificationManager';

// Members (both accepted and non-club) can only view notifications, not post them
const MemberNotifications = () => <NotificationManager canPost={false} />;

export default MemberNotifications;
