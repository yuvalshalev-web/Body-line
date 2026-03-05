
import React, { useEffect, useState } from 'react';
import { getDb } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const AdminRolloverReport: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const q = query(collection(db, 'rollover_logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="container" dir="rtl">
      <header>
        <div className="logo-area">
          <h1>// Admin Monitor</h1>
          <h2>Weekly<span>Rollover</span></h2>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">// לוג פעולות אחרונות</span>
        </div>
        <div id="stepsList">
          {logs.map((log) => (
            <div key={log.id} className="step-item">
              <div className={`step-icon ${log.status === 'success' ? 'ok' : 'fail'}`}>
                {log.status === 'success' ? '✓' : '✗'}
              </div>
              <div className="step-info">
                <div className="step-name">{log.action}</div>
                <div className="step-detail">{log.details}</div>
              </div>
              <div className="step-meta">
                <div className="step-time">{new Date(log.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRolloverReport;
