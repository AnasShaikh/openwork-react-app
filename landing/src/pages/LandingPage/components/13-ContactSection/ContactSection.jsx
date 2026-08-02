import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../../../config/emailjs.config';
import './ContactSection.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const now = new Date();
      const templateParams = {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        title: 'New Contact Form Submission',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );
      
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('EmailJS error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section id="lp-13-section" className="lp-13-section">
        <div className="lp-13-container">
          <div className="lp-13-content">
            <h2 className="lp-13-heading">Contact us</h2>
            <p className="lp-13-description">
              OpenWork is building the internet's decentralized work layer — and we can't do it without you. Whether you're here to explore, collaborate, or contribute, we're always open to meaningful conversations.
            </p>
          </div>

          <div className="lp-13-form-container">
            <div className="lp-13-contact-form lp-13-thank-you">
              <div className="lp-13-thank-you-content">
                <div className="lp-13-thank-you-icon">✓</div>
                <h3 className="lp-13-thank-you-title">Thank You!</h3>
                <p className="lp-13-thank-you-message">
                  Your message has been sent successfully. We'll get back to you soon!
                </p>
                <button 
                  type="button" 
                  className="lp-13-send-button"
                  onClick={() => setStatus('idle')}
                >
                  Send Another Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lp-13-section" className="lp-13-section">
      <div className="lp-13-container">
        <div className="lp-13-content">
          <div className="text-content">
            <h2 className="lp-13-heading">Contact us</h2>
          <p className="lp-13-description">
            OpenWork is building the internet's decentralized work layer — and we can't do it without you. Whether you're here to explore, collaborate, or contribute, we're always open to meaningful conversations.
          </p>
          </div>
        </div>

        <div className="lp-13-form-container">
          <form className="lp-13-contact-form" onSubmit={handleSubmit}>
            <input 
              type="text" 
              name="name"
              placeholder="Your name" 
              className="lp-13-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input 
              type="email" 
              name="email"
              placeholder="Your email" 
              className="lp-13-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <textarea 
              name="message"
              placeholder="Type a message here" 
              className="lp-13-textarea"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            {status === 'error' && (
              <p className="lp-13-error-message">Something went wrong. Please try again.</p>
            )}
            <button 
              type="submit" 
              className="lp-13-send-button"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
              {status !== 'submitting' && (
                <img src="/assets/lp13-arrow-icon.svg" alt="" className="lp-13-button-icon" />
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
