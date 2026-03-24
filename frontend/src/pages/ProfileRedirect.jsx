import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../utils/api';

export default function ProfileRedirect() {
  const { id } = useParams();
  const [username, setUsername] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/users/profile/${id}`)
      .then((r) => setUsername(r.data.username))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div className="p-8 text-gray-600 text-center">User not found</div>;
  if (!username) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return <Navigate to={`/${username}`} replace />;
}
