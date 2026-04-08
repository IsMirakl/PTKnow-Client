import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';

// import ProtectedRoute from './ProtectedRoute';
import AuthPage from '../Pages/AuthPage';
import CoursesPage from '../Pages/CoursesPage';
import CreateCoursePage from '../Pages/CreateCoursePage';
import CreateLessonPage from '../Pages/CreateLessonPage';
import HomePage from '../Pages/HomePage';
import { ProfilePage } from '../Pages/ProfilePage';
import RegisterPage from '../Pages/RegisterPage';
import GuestRoute from './GuestRoute';
import CourseDetailsPage from '../Pages/CourseDetailsPage';
import ProfileEditPage from '../Pages/ProfileEditPage';
import RequiredAuth from './RequiredAuth';
import RequiredRole from './RequiredRole';
import AdminUsersPage from '../Pages/AdminUsersPage';
import AdminPanelPage from '../Pages/AdminPanelPage';
import UnderConstructionPage from '../Pages/UnderConstructionPage';
import CourseRegisterPage from '../Pages/CourseRegisterPage';
import MyCoursesPage from '../Pages/MyCoursesPage';
import ProfileSearchPage from '../Pages/ProfileSearchPage';
import CommandPalette from '../Components/CommandPalette';
import CommandPaletteHint from '../Components/CommandPaletteHint';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <CommandPalette />
      <CommandPaletteHint />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route
          path="/auth"
          element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <RequiredAuth>
              <ProfilePage />
            </RequiredAuth>
          }
        />

        <Route path="/profile/:handle" element={<ProfilePage />} />
        <Route path="/profiles" element={<ProfileSearchPage />} />

        <Route
          path="/profile/edit"
          element={
            <RequiredAuth>
              <ProfileEditPage />
            </RequiredAuth>
          }
        />

        <Route
          path="/create-course"
          element={
            <RequiredRole roles={['TEACHER', 'ADMIN']}>
              <CreateCoursePage />
            </RequiredRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequiredRole roles="ADMIN">
              <AdminPanelPage />
            </RequiredRole>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequiredRole roles="ADMIN">
              <AdminUsersPage />
            </RequiredRole>
          }
        />

        <Route
          path="/courses/:courseId/lessons/new"
          element={
            <RequiredRole roles={['TEACHER', 'ADMIN']}>
              <CreateLessonPage />
            </RequiredRole>
          }
        />

        <Route
          path="/courses/:courseId/lessons/:lessonId/edit"
          element={
            <RequiredRole roles={['TEACHER', 'ADMIN']}>
              <CreateLessonPage />
            </RequiredRole>
          }
        />

        <Route
          path="/my-courses"
          element={
            <RequiredAuth>
              <MyCoursesPage />
            </RequiredAuth>
          }
        />

        <Route
          path="/course/:courseId/register"
          element={
            <RequiredRole roles={['GUEST', 'STUDENT']}>
              <CourseRegisterPage />
            </RequiredRole>
          }
        />

        <Route path="/course/:courseId" element={<CourseDetailsPage />} />

        <Route path="*" element={<UnderConstructionPage />} />
      </Routes>
    </Router>
  );
};
export default AppRouter;
