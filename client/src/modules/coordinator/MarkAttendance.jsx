import { downloadFile } from '../../api/download';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiCheck, FiX, FiCheckSquare } from 'react-icons/fi';
import { EventAPI, AttendanceAPI, ExportAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const MarkAttendance = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [participants, setParticipants] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    EventAPI.getAll({ club: clubId }).then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  }, [clubId]);

  const loadEventParticipants = async (eventId) => {
    setSelectedEvent(eventId);
    if (!eventId) { setParticipants([]); return; }
    const [eventRes, attendanceRes] = await Promise.all([
      EventAPI.getOne(eventId),
      AttendanceAPI.forEvent(eventId),
    ]);
    setParticipants(eventRes.data.event.participants);
    const map = {};
    attendanceRes.data.records.forEach((r) => { map[r.user._id] = r.present; });
    setAttendanceMap(map);
  };

  // Everyone who registered: mark all present / all absent in one go
  const markAll = async (present) => {
    const next = {};
    participants.forEach((p) => { next[p._id] = present; });
    setAttendanceMap(next);
    try {
      const res = await AttendanceAPI.markBulk({ eventId: selectedEvent, present });
      toast.success(`${res.data.updated} marked ${present ? 'present' : 'absent'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
      loadEventParticipants(selectedEvent);
    }
  };

  const presentCount = participants.filter((p) => attendanceMap[p._id]).length;
  const rate = participants.length ? Math.round((presentCount / participants.length) * 100) : 0;

  const toggle = async (userId, present) => {
    setAttendanceMap((prev) => ({ ...prev, [userId]: present }));
    try {
      await AttendanceAPI.mark({ eventId: selectedEvent, userId, present });
      toast.success('Attendance updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  if (loading) return <Loader />;
  if (!clubId) return <EmptyState title="No club assigned" />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">Attendance</h1>
      <p className="section-subtitle">Select an event to record who attended. Only people who registered for the event are listed.</p>

      <div className="form-group" style={{ maxWidth: 380 }}>
        <select className="input" value={selectedEvent} onChange={(e) => loadEventParticipants(e.target.value)}>
          <option value="">Select an event...</option>
          {events.map((e) => <option key={e._id} value={e._id}>{e.title} — {new Date(e.date).toLocaleDateString()} ({e.status})</option>)}
        </select>
      </div>

      {selectedEvent && (
        <>
          <div className="stat-strip" style={{ border: '1px solid var(--color-border)', margin: '20px 0' }}>
            <div><strong>{participants.length}</strong><span>Registered</span></div>
            <div><strong>{presentCount}</strong><span>Present</span></div>
            <div><strong>{participants.length - presentCount}</strong><span>Not marked / absent</span></div>
            <div><strong>{rate}%</strong><span>Attendance rate</span></div>
          </div>
          <div className="flex-between" style={{ margin: '0 0 10px', flexWrap: 'wrap', gap: 10 }}>
            <div className="flex gap-sm">
              <button className="btn btn-success btn-sm" onClick={() => markAll(true)} disabled={!participants.length}><FiCheckSquare /> Mark all present</button>
              <button className="btn btn-outline btn-sm" onClick={() => markAll(false)} disabled={!participants.length}><FiX /> Clear all</button>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => downloadFile(ExportAPI.attendanceCsvUrl(selectedEvent), 'attendance.csv')}>
              <FiDownload /> Export attendance
            </button>
          </div>

          {participants.length === 0 ? <EmptyState title="No one has registered for this event yet" /> : (
            <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Present</th></tr></thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${attendanceMap[p._id] ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => toggle(p._id, !attendanceMap[p._id])}
                      >
                        <FiCheck /> {attendanceMap[p._id] ? 'Present' : 'Mark present'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarkAttendance;
