import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { validateInvitationToken } from '../../../store/preRegistrationSlice';

export const TokenValidation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [validationStatus, setValidationStatus] = useState<'loading' | 'valid' | 'expired' | 'invalid' | 'used'>('loading');
  const [preRegistration, setPreRegistration] = useState<any>(null);

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setValidationStatus('invalid');
    }
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      const result = await dispatch(validateInvitationToken(tokenValue)).unwrap();
      setPreRegistration(result);
      
      if (result.status === 'registered') {
        setValidationStatus('used');
      } else if (new Date(result.expiresAt) < new Date()) {
        setValidationStatus('expired');
      } else {
        setValidationStatus('valid');
      }
    } catch (error) {
      setValidationStatus('invalid');
    }
  };

  const handleProceedToRegistration = () => {
    navigate(`/register/${token}`);
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'loading':
        return <ClockIcon className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'valid':
        return <CheckCircleIcon className="w-16 h-16 text-green-500" />;
      case 'expired':
        return <ClockIcon className="w-16 h-16 text-orange-500" />;
      case 'used':
        return <CheckCircleIcon className="w-16 h-16 text-gray-500" />;
      case 'invalid':
      default:
        return <XCircleIcon className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (validationStatus) {
      case 'loading':
        return {
          title: 'Validating Invitation',
          message: 'Please wait while we verify your invitation token...',
          action: null
        };
      case 'valid':
        return {
          title: 'Valid Invitation',
          message: `Welcome! You've been invited to join QSHE as ${preRegistration?.userType === 'internal' ? 'an internal employee' : 'an external contractor'}. Please proceed with your registration.`,
          action: (
            <Button onClick={handleProceedToRegistration} className="w-full sm:w-auto">
              Proceed to Registration
            </Button>
          )
        };
      case 'expired':
        return {
          title: 'Invitation Expired',
          message: 'This invitation has expired. Please contact your administrator for a new invitation.',
          action: (
            <Button variant="outline" onClick={() => window.location.href = 'mailto:admin@qshe.com'}>
              Contact Administrator
            </Button>
          )
        };
      case 'used':
        return {
          title: 'Invitation Already Used',
          message: 'This invitation has already been used to create an account. If this is your account, please login instead.',
          action: (
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          )
        };
      case 'invalid':
      default:
        return {
          title: 'Invalid Invitation',
          message: 'This invitation token is not valid. Please check the link and try again, or contact your administrator.',
          action: (
            <Button variant="outline" onClick={() => window.location.href = 'mailto:admin@qshe.com'}>
              Contact Administrator
            </Button>
          )
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.svg" 
            alt="QSHE Logo" 
            className="h-12 w-12"
          />
        </div>
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
          QSHE Registration
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Construction Safety Management System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card padding="lg">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {statusInfo.title}
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {statusInfo.message}
            </p>

            {preRegistration && validationStatus === 'valid' && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">Invitation Details:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Email:</strong> {preRegistration.email}</p>
                  <p><strong>Type:</strong> {preRegistration.userType === 'internal' ? 'Internal Employee' : 'External Contractor'}</p>
                  <p><strong>Expires:</strong> {new Date(preRegistration.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            
            {statusInfo.action}
          </div>
        </Card>
      </div>
    </div>
  );
};
