import { io } from 'socket.io-client';
import { BASE_URL } from './api';

const socket = io(BASE_URL, { autoConnect: false, transports: ['websocket'] });
export default socket;
