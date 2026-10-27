import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { FeedPage } from "./features/feed/FeedPage";
import { CreatePinPage } from "./features/pins/CreatePinPage";
import { PinDetailPage } from "./features/pins/PinDetailPage";
import { BoardsPage } from "./features/boards/BoardsPage";
import { BoardDetailPage } from "./features/boards/BoardDetailPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { ChatPage } from "./features/chat/ChatPage";
import { ConversationPage } from "./features/chat/ConversationPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/pins/:id" element={<PinDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/boards/:id" element={<BoardDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/pins/new" element={<CreatePinPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ConversationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
