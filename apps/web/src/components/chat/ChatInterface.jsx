import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Send,
  Paperclip,
  Phone,
  Video,
  Search,
  MessageCircle,
  Bot,
  X,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDropzone } from 'react-dropzone';
import VideoCall from './VideoCall';
import MessageBubble from './MessageBubble';
import ConversationList from './ConversationList';
import VoiceRecorder from './VoiceRecorder';
import SupportChatInterface from '@/components/support/SupportChatInterface';
import supportService from '@/services/supportService';
import { uploadVoice, formatVoiceMessage } from '@/utils/voiceUpload';

const ChatInterface = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    unreadCounts,
    isTyping,
    videoCall,
    sendMessage,
    startTyping,
    stopTyping,
    setActiveConversation,
    markAsRead,
    loadMessages,
    initiateCall,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showSupport, setShowSupport] = useState(false);
  const [supportChatHistory, setSupportChatHistory] = useState([]);
  const [agentStatus, setAgentStatus] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markAsRead(activeConversation.id);
      setShowConversationList(false);
    }
  }, [activeConversation]);

  // Load agent status once
  useEffect(() => {
    setAgentStatus(supportService.getAgentAvailability());
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleClickOutside = useCallback(
    (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;
    await sendMessage(activeConversation.id, messageInput.trim());
    setMessageInput('');
    stopTyping(activeConversation.id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      startTyping(activeConversation?.id);
    }
  };

  const handleFileUpload = async (acceptedFiles) => {
    if (!activeConversation) return;
    for (const file of acceptedFiles) {
      await sendMessage(activeConversation.id, `Sent: ${file.name}`, 'file', file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const handleVoiceRecordingComplete = async (recording) => {
    if (!activeConversation || !user) return;

    setIsUploadingVoice(true);
    setIsRecordingVoice(false);

    try {
      console.log('[ChatInterface] Uploading voice message...', {
        duration: recording.duration,
        waveformLength: recording.waveformData.length,
      });

      const uploadResult = await uploadVoice(
        recording.blob,
        user.id,
        activeConversation.id,
        recording.duration,
        recording.waveformData,
        (progress) => console.log('[ChatInterface] Voice upload progress:', progress)
      );

      const content = formatVoiceMessage(uploadResult);
      await sendMessage(activeConversation.id, content, 'audio');
      console.log('[ChatInterface] Voice message sent successfully');
    } catch (error) {
      console.error('[ChatInterface] Voice upload failed:', error);
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handleVideoCall = () => {
    if (!activeConversation) return;
    const participantId = activeConversation.participants.find((id) => id !== user.id);
    const participantName = activeConversation.participantNames.find(
      (_, index) => activeConversation.participants[index] !== user.id
    );
    initiateCall(participantId, participantName);
  };

  const filteredConversations = conversations.filter((conv) => {
    // Handle ChatContext format (partnerName) and legacy format (participantNames array)
    const searchLower = searchQuery.toLowerCase();
    if (conv.partnerName) {
      return conv.partnerName.toLowerCase().includes(searchLower);
    }
    if (conv.participantNames) {
      return conv.participantNames.some((name) => name.toLowerCase().includes(searchLower));
    }
    return true;
  });

  const currentMessages = activeConversation ? messages[activeConversation.id] || [] : [];
  const typingUsers = activeConversation ? isTyping[activeConversation.id] || [] : [];

  if (videoCall) return <VideoCall callData={videoCall} />;

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Messaging'
      className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 ${
        isOpen ? '' : 'hidden'
      }`}
    >
      <div
        ref={modalRef}
        className='bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col relative'
      >
        {/* Header */}
        <div className='flex items-center justify-between p-3 sm:p-4 border-b bg-white rounded-t-lg'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowConversationList(!showConversationList)}
              className='lg:hidden'
            >
              <MessageCircle className='h-4 w-4 sm:h-5 sm:w-5' />
            </Button>

            {showSupport ? (
              <div className='flex items-center gap-2'>
                <Bot className='h-5 w-5 text-purple-600' />
                <h3 className='font-semibold text-sm sm:text-base'>Customer Support AI</h3>
              </div>
            ) : activeConversation ? (
              <>
                <Avatar className='h-8 w-8 sm:h-10 sm:w-10'>
                  <AvatarImage src='' />
                  <AvatarFallback className='text-sm'>
                    {activeConversation.participantNames
                      .find((_, index) => activeConversation.participants[index] !== user.id)
                      ?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <h3 className='font-semibold text-sm sm:text-base truncate'>
                    {activeConversation.participantNames.find(
                      (_, index) => activeConversation.participants[index] !== user.id
                    )}
                  </h3>
                  <p className='text-xs sm:text-sm text-gray-500 truncate'>
                    {activeConversation.participantTypes.find(
                      (_, index) => activeConversation.participants[index] !== user.id
                    )}
                  </p>
                </div>
              </>
            ) : (
              <h3 className='font-semibold text-sm sm:text-base'>Messages</h3>
            )}
          </div>

          <div className='flex items-center gap-1 sm:gap-2'>
            {activeConversation && !showSupport && (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleVideoCall}
                  className='text-blue-600 hover:text-blue-700 p-1 sm:p-2'
                >
                  <Video className='h-4 w-4 sm:h-5 sm:w-5' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    const voiceEvent = new CustomEvent('openVoiceAgent', {
                      detail: { conversationId: activeConversation.id },
                    });
                    window.dispatchEvent(voiceEvent);
                  }}
                  className='text-green-600 hover:text-green-700 p-1 sm:p-2'
                  title='Start Voice Call with AI Assistant'
                >
                  <Phone className='h-4 w-4 sm:h-5 sm:w-5' />
                </Button>
              </>
            )}
            <Button
              variant={showSupport ? 'default' : 'outline'}
              size='sm'
              onClick={() => setShowSupport((s) => !s)}
              title='Toggle Support AI'
            >
              <Bot className='h-4 w-4 mr-1' />
              {showSupport ? 'Support AI' : 'Ask Support AI'}
            </Button>
            <Button variant='ghost' size='sm' onClick={onClose} className='p-1 sm:p-2'>
              <X className='h-4 w-4 sm:h-5 sm:w-5' />
            </Button>
          </div>
        </div>

        <div className='flex flex-1 overflow-hidden bg-gray-50'>
          {showSupport ? (
            <SupportChatInterface
              chatHistory={supportChatHistory}
              setChatHistory={setSupportChatHistory}
              agentStatus={agentStatus}
              onSendMessage={({ message, category }) =>
                supportService.sendSupportMessage({ user, message, category })
              }
            />
          ) : (
            <>
              {showConversationList && (
                <div className='w-64 sm:w-80 border-r bg-white flex flex-col'>
                  <div className='p-3 sm:p-4 border-b bg-white'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                      <Input
                        placeholder='Search conversations...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-10 text-sm'
                      />
                    </div>
                  </div>

                  <ConversationList
                    conversations={filteredConversations}
                    activeConversation={activeConversation}
                    unreadCounts={unreadCounts}
                    onSelectConversation={setActiveConversation}
                  />
                </div>
              )}

              <div className='flex-1 flex flex-col bg-white'>
                {activeConversation ? (
                  <>
                    {/* Messages */}
                    <ScrollArea className='flex-1 p-3 sm:p-4 bg-gray-50'>
                      <div className='space-y-3 sm:space-y-4 max-w-4xl mx-auto'>
                        {currentMessages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isOwn={message.senderId === user.id}
                          />
                        ))}

                        {typingUsers.length > 0 && (
                          <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-500'>
                            <div className='flex gap-1'>
                              <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                              <div
                                className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                            <span>Someone is typing...</span>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className='p-3 sm:p-4 border-t bg-white'>
                      {/* Voice Recorder UI */}
                      {isRecordingVoice ? (
                        <VoiceRecorder
                          onRecordingComplete={handleVoiceRecordingComplete}
                          onCancel={() => setIsRecordingVoice(false)}
                          maxDuration={180}
                        />
                      ) : (
                        <div className='flex items-center gap-2 max-w-4xl mx-auto'>
                          <div {...getRootProps()} className='cursor-pointer'>
                            <input {...getInputProps()} />
                            <Button variant='ghost' size='sm' className='p-1 sm:p-2'>
                              <Paperclip className='h-4 w-4 sm:h-5 sm:w-5' />
                            </Button>
                          </div>

                          <div className='flex-1'>
                            <Input
                              ref={inputRef}
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              onBlur={() => stopTyping(activeConversation.id)}
                              placeholder='Type a message...'
                              className='text-sm'
                            />
                          </div>

                          {/* Mic button - always visible for voice recording */}
                          <button
                            type='button'
                            onClick={() => setIsRecordingVoice(true)}
                            disabled={isUploadingVoice}
                            className='h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50'
                            title='Record voice message'
                          >
                            {isUploadingVoice ? (
                              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            ) : (
                              <Mic className='h-5 w-5' />
                            )}
                          </button>

                          {/* Send button - only when there's text */}
                          {messageInput.trim() && (
                            <Button
                              onClick={handleSendMessage}
                              size='icon'
                              className='h-10 w-10 rounded-full flex-shrink-0'
                            >
                              <Send className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      )}

                      {isDragActive && (
                        <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs sm:text-sm text-blue-600 max-w-4xl mx-auto'>
                          Drop files here to upload
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='flex-1 flex items-center justify-center text-gray-500 bg-gray-50 p-4'>
                    <div className='text-center'>
                      <MessageCircle className='h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300' />
                      <h3 className='text-base sm:text-lg font-medium mb-1 sm:mb-2'>
                        No conversation selected
                      </h3>
                      <p className='text-sm'>
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

