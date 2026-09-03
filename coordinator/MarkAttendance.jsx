import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiCheck } from 'react-icons/fi';
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
      <h1 className="section-title">Mark Attendance</h1>
      <p className="section-subtitle">Select an event to record who attended.</p>

      <div className="form-group" style={{ maxWidth: 380 }}>
        <select className="input" value={selectedEvent} onChange={(e) => loadEventParticipants(e.target.value)}>
          <option value="">Select an event...</option>
          {events.map((e) => <option key={e._id} value={e._id}>{e.title} — {new Date(e.date).toLocaleDateString()}</option>)}
        </select>
      </div>

      {selectedEvent && (
        <>
          <div className="flex-between" style={{ margin: '20px 0 10px' }}>
            <h3 style={{ margin: 0 }}>Participants ({participants.length})</h3>
            <a className="btn btn-outline btn-sm" href={ExportAPI.attendanceCsvUrl(selectedEvent)} target="_blank" rel="noreferrer">
              <FiDownload /> Export attendance
            </a>
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
