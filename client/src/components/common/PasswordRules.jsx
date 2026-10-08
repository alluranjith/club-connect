import { FiCheck, FiX } from 'react-icons/fi';
import { PASSWORD_RULES } from '../../utils/password';

// Live checklist shown under every "new password" field
const PasswordRules = ({ value = '' }) => (
  <ul className="pw-rules">
    {PASSWORD_RULES.map((r) => {
      const ok = r.test(value);
      return (
        <li key={r.id} className={ok ? 'ok' : ''}>
          {ok ? <FiCheck /> : <FiX />} {r.label}
        </li>
      );
    })}
  </ul>
);

export default PasswordRules;
