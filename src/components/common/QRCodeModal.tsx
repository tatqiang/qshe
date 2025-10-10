import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { 
  DocumentDuplicateIcon, 
  CheckIcon,
  LinkIcon,
  QrCodeIcon 
} from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { Button } from './Button';
import type { User } from '../../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  invitationLink: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  user,
  invitationLink,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = invitationLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Profile Completion QR Code"
      size="md"
    >
      <div className="space-y-6">
        {/* User Info Header */}
        <div className="text-center border-b pb-4">
          <div className="flex items-center justify-center mb-2">
            <QrCodeIcon className="w-8 h-8 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Profile Setup for {user.firstName} {user.lastName}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Scan this QR code or share the link for profile completion
          </p>
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-6 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <QRCode
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={invitationLink}
              viewBox="0 0 256 256"
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>
        </div>

        {/* Link Display and Copy */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <LinkIcon className="w-4 h-4" />
            <span>Profile completion link:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-50 border rounded-md">
              <p className="text-sm text-gray-800 break-all font-mono">
                {invitationLink}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className={`flex items-center space-x-1 min-w-[80px] ${
                copied ? 'text-green-600 border-green-300' : ''
              }`}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            How to use this QR code:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ask the user to scan this QR code with their phone camera</li>
            <li>• Or share the link via email, messaging, or other methods</li>
            <li>• The user will be directed to complete their profile setup</li>
            <li>• They can set their password, upload profile photo, and configure face recognition</li>
          </ul>
        </div>

        {/* User Details Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-800 mb-2">User Information:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 text-gray-900">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 text-gray-900">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 text-gray-900 capitalize">
                {user.role?.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                user.status === 'invited' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : user.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.status === 'invited' ? 'Pending Setup' : user.status}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            onClick={handleCopyLink}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>
    </Modal>
  );
};
