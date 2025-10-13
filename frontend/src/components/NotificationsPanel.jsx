import React from 'react';
import { Link } from 'react-router-dom';

function NotificationsPanel({ notifications, onMarkAsRead }) {
  if (notifications.length === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-md shadow-lg border p-4">
        <p className="text-sm text-gray-500">You have no new notifications.</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-md shadow-lg border max-h-96 overflow-y-auto">
      <div className="p-2">
        <h3 className="text-sm font-bold text-gray-700 px-2 py-1">Notifications</h3>
      </div>
      <div className="divide-y">
        {notifications.map(notification => (
          <div
            key={notification._id}
            onClick={() => !notification.is_read && onMarkAsRead(notification._id)}
            className={`p-3 hover:bg-gray-100 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
          >
            <Link to={notification.link || '#'}>
              <p className="text-sm text-gray-800">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationsPanel;