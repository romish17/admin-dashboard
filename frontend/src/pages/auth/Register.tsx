import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { getErrorMessage } from '@/services/api';
import toast from 'react-hot-toast';

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={errors.email ? 'input-error' : 'input'}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
          })}
        />
        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="username" className="label">Username</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className={errors.username ? 'input-error' : 'input'}
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 3, message: 'At least 3 characters' },
            pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Letters, numbers, _ and - only' },
          })}
        />
        {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={errors.password ? 'input-error' : 'input'}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Must contain uppercase, lowercase, and number',
            },
          })}
        />
        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={errors.confirmPassword ? 'input-error' : 'input'}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-dark-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300">Sign in</Link>
      </p>
    </form>
  );
}
