const Notification = require('../models/Notification');

const when = (e) => {
  const d = new Date(e.date);
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
};

// Pushes an event update into the notification feed (club members see it; platform-wide events reach everyone).
// kind: 'created' | 'updated' | 'cancelled'. Never throws - a failed notification must not break event editing.
const notifyEvent = async (event, kind, byUserId) => {
  try {
    const place = event.venue ? ` at ${event.venue}` : '';
    const text = {
      created: {
        title: `New event: ${event.title}`,
        message: `${when(event)}${place}.${event.description ? ` ${String(event.description).slice(0, 140)}` : ''} Tap to see details and participate.`,
      },
      updated: {
        title: `Event updated: ${event.title}`,
        message: `Now on ${when(event)}${place}. Check the latest details.`,
      },
      cancelled: {
        title: `Event cancelled: ${event.title}`,
        message: `This event, planned for ${when(event)}, has been cancelled.`,
      },
    }[kind];
    await Notification.create({
      ...text,
      image: event.bannerImage || '',
      type: 'event',
      event: event._id,
      club: event.club || null,
      createdBy: byUserId,
    });
  } catch (e) {
    console.error('Event notification failed:', e.message);
  }
};

module.exports = { notifyEvent };
