const PHONE_RE = /^\d{10}$/;

// A profile is complete when the user has a real name, a profile image and a 10-digit mobile number
// AND has saved it through the profile form (profileCompleted flag). Bio is optional.
const fieldsValid = (u) =>
  String(u.name || '').trim().length >= 2 && !!u.avatar && PHONE_RE.test(String(u.phone || ''));

const isProfileComplete = (u) => !!u.profileCompleted && fieldsValid(u);

module.exports = { PHONE_RE, fieldsValid, isProfileComplete };
