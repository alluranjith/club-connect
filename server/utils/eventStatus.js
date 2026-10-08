const Event = require('../models/Event');

// Moves events forward automatically: upcoming -> ongoing -> completed.
//  - An event with an endDate is over once endDate has passed.
//  - An event without an endDate is treated as a same-day event (over at 23:59:59 of its date).
//  - Cancelled and already-completed events are never touched, and status never moves backwards.
const endOf = (e) => {
  if (e.endDate) return new Date(e.endDate);
  const d = new Date(e.date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const syncEventStatuses = async () => {
  const now = new Date();
  const open = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } }).select('date endDate status');
  const ops = [];
  open.forEach((e) => {
    let next = e.status;
    if (now > endOf(e)) next = 'completed';
    else if (now >= new Date(e.date)) next = 'ongoing';
    if (next !== e.status) ops.push({ updateOne: { filter: { _id: e._id }, update: { $set: { status: next } } } });
  });
  if (ops.length) await Event.bulkWrite(ops);
  return ops.length;
};

module.exports = { syncEventStatuses };
