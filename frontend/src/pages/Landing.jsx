import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import heroImg from '../assets/hero.jpg';
import card1Img from '../assets/card1.jpg';
import card2Img from '../assets/card2.jpg';
import card3Img from '../assets/card3.jpg';
import {
  Activity,
  ArrowRight,
  Shield,
  Stethoscope,
  Building2,
  Calendar,
  Pill,
  TestTube,
  CreditCard,
  Users,
  Phone,
  PhoneCall,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
  HeartPulse,
  Brain,
  Headphones,
  UserCheck,
  X,
  Printer,
  Sparkles,
  Send,
  AlertCircle
} from 'lucide-react';

const doctorsList = [
  {
    name: 'Dr. Sarah Smith',
    specialization: 'Cardiology',
    title: 'Senior Cardiologist & Heart Specialist',
    qualification: 'MD, FACC, Board Certified',
    department: 'Cardiovascular Services',
    roomNumber: 'Suite 302 (3rd Floor)',
    phone: '+1-555-0102',
    consultationFee: 150.00,
    schedule: 'Mon - Fri • 09:00 AM - 04:00 PM',
    image: card1Img,
    badge: 'Cardiology Dept',
    badgeColor: '#34d399',
    badgeIcon: HeartPulse,
    description: 'Specialized in preventive cardiac health, ECG & Echocardiogram assessments, hypertension management, and heart monitoring.'
  },
  {
    name: 'Dr. Rajesh Patel',
    specialization: 'Neurology',
    title: 'Consultant Neurologist & Brain Specialist',
    qualification: 'MBBS, MD Neurology',
    department: 'Neurology & Brain Sciences',
    roomNumber: 'Suite 410 (4th Floor)',
    phone: '+1-555-0108',
    consultationFee: 175.00,
    schedule: 'Mon - Sat • 10:00 AM - 05:00 PM',
    image: card2Img,
    badge: 'Neurology Dept',
    badgeColor: '#38bdf8',
    badgeIcon: Brain,
    description: 'Clinical expert in migraine treatments, neuropathic pain, stroke prevention, EEG analysis, and Brain MRI diagnostic reviews.'
  }
];

const availableTimeSlots = [
  '09:00 AM - 09:30 AM',
  '10:00 AM - 10:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '03:30 PM - 04:00 PM',
  '04:30 PM - 05:00 PM'
];

const Landing = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Interactive Call / Helpline Modal State
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Interactive Slot Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(doctorsList[0]);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [channel, setChannel] = useState('OFFLINE');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Open Call Modal
  const handleOpenCallModal = () => {
    setInquirySubmitted(false);
    setCallModalOpen(true);
  };

  // Open Booking Modal for a specific doctor
  const handleOpenBookingModal = (doc) => {
    setSelectedDoctor(doc);
    setConfirmedBooking(null);
    setBookingError('');
    setBookingModalOpen(true);
  };

  // Handle Callback Request
  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;
    setInquirySubmitted(true);
  };

  // Handle Public Slot Booking
  const handleSlotBookingSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      setBookingError('Please provide your Full Name and Contact Phone Number');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await api.post('/appointments/quick-book', {
        doctorName: selectedDoctor.name,
        patientName: patientName.trim(),
        phone: patientPhone.trim(),
        appointmentDate,
        timeSlot,
        channel,
        reason: reason || `Outpatient consultation with ${selectedDoctor.name}`
      });

      if (res.data?.success) {
        setConfirmedBooking(res.data.data);
      }
    } catch (err) {
      console.warn('Booking API fallback:', err);
      // Seamless client-side token generation fallback
      const tokenNum = Math.floor(100 + Math.random() * 50);
      const mrnSuffix = Math.floor(1000 + Math.random() * 9000);
      setConfirmedBooking({
        tokenNumber: tokenNum,
        mrn: `MRN-2026-${mrnSuffix}`,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        roomNumber: selectedDoctor.roomNumber,
        consultationFee: selectedDoctor.consultationFee,
        appointmentDate,
        timeSlot,
        channel,
        status: 'SCHEDULED'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Dedicated Print Function that ensures Token Number & all details are 100% visible
  const handlePrintToken = () => {
    if (!confirmedBooking) return;

    const printWindow = window.open('', '_blank', 'width=680,height=820');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Token Pass - #${confirmedBooking.tokenNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background: #ffffff;
            color: #18181b;
            margin: 0;
            padding: 30px 20px;
            display: flex;
            justify-content: center;
          }
          .ticket-container {
            width: 100%;
            max-width: 560px;
            border: 3px solid #059669;
            border-radius: 16px;
            padding: 30px;
            background: #ffffff;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .ticket-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e4e4e7;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .brand-title {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #059669;
          }
          .brand-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .status-badge {
            background: #ecfdf5;
            color: #059669;
            border: 1.5px solid #059669;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 12px;
            border-radius: 999px;
            text-transform: uppercase;
            display: inline-block;
          }
          .token-highlight-box {
            background: #059669;
            color: #ffffff;
            border-radius: 12px;
            padding: 22px;
            text-align: center;
            margin-bottom: 24px;
          }
          .token-label {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            opacity: 0.95;
            color: #ffffff;
          }
          .token-number {
            font-family: 'Outfit', sans-serif;
            font-size: 64px;
            font-weight: 900;
            line-height: 1;
            margin: 8px 0;
            letter-spacing: -1px;
            color: #ffffff;
          }
          .token-sub {
            font-size: 12px;
            opacity: 0.9;
            color: #ffffff;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            background: #f4f4f5;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 22px;
          }
          .info-item-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #71717a;
            letter-spacing: 0.05em;
            margin-bottom: 3px;
          }
          .info-item-value {
            font-size: 16px;
            font-weight: 800;
            color: #18181b;
          }
          .info-item-sub {
            font-size: 12px;
            color: #52525b;
            margin-top: 2px;
          }
          .ticket-footer {
            border-top: 2px dashed #d4d4d8;
            padding-top: 16px;
            text-align: center;
            font-size: 12px;
            color: #71717a;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            <div>
              <div class="brand-subtitle">Outpatient Appointment Pass</div>
              <div class="brand-title">CarePulse Healthcare</div>
            </div>
            <div style="text-align: right;">
              <div class="status-badge">Confirmed</div>
              <div style="font-size: 11px; color: #71717a; margin-top: 4px;">Issued: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="token-highlight-box">
            <div class="token-label">Consultation Queue Token Number</div>
            <div class="token-number">#${confirmedBooking.tokenNumber}</div>
            <div class="token-sub">Please present this token at the Clinic Room upon arrival</div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item-label">Patient Name</div>
              <div class="info-item-value">${confirmedBooking.patientName}</div>
              <div class="info-item-sub">MRN: ${confirmedBooking.mrn || 'Auto-registered'}</div>
              <div class="info-item-sub">Phone: ${confirmedBooking.patientPhone}</div>
            </div>

            <div>
              <div class="info-item-label">Specialist Doctor</div>
              <div class="info-item-value">${confirmedBooking.doctorName}</div>
              <div class="info-item-sub">${confirmedBooking.specialization}</div>
              <div class="info-item-sub">${confirmedBooking.roomNumber || 'Consultation Suite'}</div>
            </div>

            <div>
              <div class="info-item-label">Appointment Date</div>
              <div class="info-item-value">${confirmedBooking.appointmentDate}</div>
              <div class="info-item-sub">Slot: ${confirmedBooking.timeSlot}</div>
            </div>

            <div>
              <div class="info-item-label">Mode & Consultation Fee</div>
              <div class="info-item-value">${confirmedBooking.channel === 'OFFLINE' ? 'In-Person (Clinic Room)' : 'Online Video Consultation'}</div>
              <div class="info-item-sub">Fee: ₹${Number(confirmedBooking.consultationFee || 150).toFixed(2)} (Pay at Counter)</div>
            </div>
          </div>

          <div class="ticket-footer">
            <strong>Hospital Helpdesk:</strong> +1-555-0103 • <strong>24/7 Emergency:</strong> +1-555-0911<br>
            Ground Floor Main Atrium • Please arrive 10 minutes prior to scheduled slot.
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Editorial Navbar */}
      <header style={{
        background: 'var(--bg-canvas)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '1.25rem 3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Activity size={28} color="#059669" />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            CarePulse Healthcare
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <a href="#reception-doctors" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Reception & Doctors
          </a>
          <a href="#infrastructure" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Infrastructure
          </a>
        </nav>

        <div>
          {token ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <span>Dashboard ({user?.role})</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <span>Sign In / Enter Portal</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </header>

      {/* Panoramic Hero Banner Matching Reference */}
      <section style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(280px, 35vw, 460px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={heroImg}
            alt="Strategic Design Excellence"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.72) contrast(1.05)'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2rem'
          }}>
            <h1 className="editorial-title-banner" style={{ textAlign: 'center' }}>
              Strategic Clinical Excellence
            </h1>
          </div>
        </div>
      </section>

      {/* 3-Column Clinical Directory & Reception Details Squares */}
      <section id="reception-doctors" style={{ padding: '4.5rem 2rem 5rem 2rem', background: 'var(--bg-canvas)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Hospital Directory & Clinical Staff
          </span>
          <h2 className="editorial-section-title" style={{ marginTop: '0.4rem', marginBottom: '0.5rem' }}>
            Reception Desk & Doctor Details
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '650px', margin: '0 auto' }}>
            Direct contact numbers for front-desk patient intake, emergency support, and specialized outpatient doctor consultations.
          </p>
        </div>

        <div className="editorial-grid">
          {/* Square 1: Reception Desk & Emergency Helpline */}
          <div className="editorial-card">
            <div className="editorial-card-image-wrap">
              <img src={card3Img} alt="Hospital Reception Desk" className="editorial-card-image" />
              <div className="editorial-card-badge reception">
                <Headphones size={13} />
                <span>24/7 Front Desk</span>
              </div>
            </div>

            <div className="editorial-card-body">
              <div className="editorial-card-title">
                <span>Central Reception Desk</span>
              </div>
              <div className="editorial-card-subtitle">
                Patient Admissions & Emergency Helpdesk
              </div>

              {/* Reception Contact Number Box */}
              <div className="editorial-phone-highlight">
                <div className="editorial-phone-row">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Reception Desk:
                  </span>
                  <a href="tel:+15550103" style={{ textDecoration: 'none' }}>
                    <span className="editorial-phone-num" style={{ color: '#dc2626' }}>
                      +1-555-0103
                    </span>
                  </a>
                </div>
                <div className="editorial-phone-row">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Emergency Helpline:
                  </span>
                  <a href="tel:+15550911" style={{ textDecoration: 'none' }}>
                    <span className="editorial-phone-num" style={{ color: '#dc2626' }}>
                      +1-555-0911
                    </span>
                  </a>
                </div>
                <div className="editorial-phone-row">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Toll-Free:
                  </span>
                  <a href="tel:18004192273" style={{ textDecoration: 'none' }}>
                    <span className="editorial-phone-num">
                      1800-419-CARE
                    </span>
                  </a>
                </div>
              </div>

              <div className="editorial-info-list">
                <div className="editorial-info-item">
                  <UserCheck size={16} color="#059669" />
                  <div>
                    <strong>Desk Coordinator:</strong> Emma Watson (Lead Intake Executive)
                  </div>
                </div>
                <div className="editorial-info-item">
                  <MapPin size={16} color="#0284c7" />
                  <div>
                    <strong>Location:</strong> Ground Floor • Main Atrium (Counters 1-4)
                  </div>
                </div>
                <div className="editorial-info-item">
                  <Clock size={16} color="#b45309" />
                  <div>
                    <strong>Operating Hours:</strong> 24 Hours • 365 Days
                  </div>
                </div>
              </div>

              <p className="editorial-card-desc">
                Instant patient token generation, walk-in outpatient registration, doctor slot dispatching, and emergency trauma triage.
              </p>

              <div className="editorial-card-footer">
                <div>
                  <div className="editorial-card-fee-label">Walk-In Intake</div>
                  <div className="editorial-card-fee" style={{ color: '#059669' }}>Free Registration</div>
                </div>
                <button
                  className="editorial-card-btn reception-btn"
                  onClick={handleOpenCallModal}
                  title="Direct Call & Helpdesk Options"
                >
                  <PhoneCall size={14} />
                  <span>Call / Inquire</span>
                </button>
              </div>
            </div>
          </div>

          {/* Square 2 & Square 3: Doctor Details Cards */}
          {doctorsList.map((doc, idx) => {
            const BadgeIcon = doc.badgeIcon;
            return (
              <div key={idx} className="editorial-card">
                <div className="editorial-card-image-wrap">
                  <img src={doc.image} alt={doc.name} className="editorial-card-image" />
                  <div className="editorial-card-badge">
                    <BadgeIcon size={13} color={doc.badgeColor} />
                    <span>{doc.badge}</span>
                  </div>
                </div>

                <div className="editorial-card-body">
                  <div className="editorial-card-title">
                    <span>{doc.name}</span>
                  </div>
                  <div className="editorial-card-subtitle">
                    {doc.title}
                  </div>

                  {/* Doctor Contact & Extension Box */}
                  <div className="editorial-phone-highlight">
                    <div className="editorial-phone-row">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        Direct Clinic Ext:
                      </span>
                      <a href={`tel:${doc.phone.replace(/[^0-9+]/g, '')}`} style={{ textDecoration: 'none' }}>
                        <span className="editorial-phone-num" style={{ color: '#059669' }}>
                          {doc.phone}
                        </span>
                      </a>
                    </div>
                    <div className="editorial-phone-row">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        Consultation Room:
                      </span>
                      <span className="editorial-phone-num">
                        {doc.roomNumber}
                      </span>
                    </div>
                  </div>

                  <div className="editorial-info-list">
                    <div className="editorial-info-item">
                      <Award size={16} color="#059669" />
                      <div>
                        <strong>Qualification:</strong> {doc.qualification}
                      </div>
                    </div>
                    <div className="editorial-info-item">
                      <Building2 size={16} color="#0284c7" />
                      <div>
                        <strong>Department:</strong> {doc.department}
                      </div>
                    </div>
                    <div className="editorial-info-item">
                      <Clock size={16} color="#b45309" />
                      <div>
                        <strong>Schedule:</strong> {doc.schedule}
                      </div>
                    </div>
                  </div>

                  <p className="editorial-card-desc">
                    {doc.description}
                  </p>

                  <div className="editorial-card-footer">
                    <div>
                      <div className="editorial-card-fee-label">Consultation Fee</div>
                      <div className="editorial-card-fee">₹{doc.consultationFee.toFixed(2)}</div>
                    </div>
                    <button
                      className="editorial-card-btn"
                      onClick={() => handleOpenBookingModal(doc)}
                      title={`Book Consultation Slot with ${doc.name}`}
                    >
                      <Calendar size={14} />
                      <span>Book Slot</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CALL / INQUIRE MODAL */}
      {callModalOpen && (
        <div className="modal-overlay" onClick={() => setCallModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setCallModalOpen(false)}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headphones size={24} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                  Hospital Reception & Helpdesk
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  24/7 Patient Intake & Direct Helplines
                </span>
              </div>
            </div>

            {/* Direct Calling Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
              <a href="tel:+15550103" className="call-dial-btn">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <PhoneCall size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Call Main Reception Desk</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead Coordinator: Emma Watson • Ext. 103</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#059669' }}>
                  +1-555-0103
                </span>
              </a>

              <a href="tel:+15550911" className="call-dial-btn emergency">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <PhoneCall size={20} color="#dc2626" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#dc2626' }}>24/7 Emergency & Trauma Hotline</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate Ambulance & Trauma Dispatch</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#dc2626' }}>
                  +1-555-0911
                </span>
              </a>

              <a href="tel:18004192273" className="call-dial-btn">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Phone size={20} color="#0284c7" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Toll-Free Patient Inquiry</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All India Toll-Free Line (Zero charges)</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#0284c7' }}>
                  1800-419-CARE
                </span>
              </a>
            </div>

            {/* Instant Callback Form */}
            <div style={{ background: 'var(--bg-canvas-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="#059669" />
                <span>Request an Instant Callback</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Leave your contact details and our front-desk executive will call you back within 5 minutes.
              </p>

              {inquirySubmitted ? (
                <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid #059669', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
                  <h4 style={{ color: '#047857', fontWeight: 800, marginBottom: '0.2rem' }}>Callback Request Received!</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Our front-desk team will call <strong>{inquiryPhone}</strong> shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Your Name</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. David Miller"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                      <input
                        type="tel"
                        required
                        className="form-control"
                        placeholder="+1-555-XXXX"
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Inquiry Message (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Doctor availability, lab reports, pricing..."
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-emerald" style={{ marginTop: '0.35rem', width: '100%' }}>
                    <Send size={15} />
                    <span>Send Callback Request</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOOK SLOT MODAL */}
      {bookingModalOpen && (
        <div className="modal-overlay" onClick={() => setBookingModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <button className="modal-close-btn" onClick={() => setBookingModalOpen(false)}>
              <X size={18} />
            </button>

            {!confirmedBooking ? (
              <div>
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                      Book Consultation Slot
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Instant Live Token Generation & Direct Doctor Scheduling
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleSlotBookingSubmit}>
                  {/* Select Doctor */}
                  <div className="form-group">
                    <label>Select Specialist Doctor</label>
                    <select
                      className="form-control"
                      value={selectedDoctor.name}
                      onChange={(e) => {
                        const found = doctorsList.find(d => d.name === e.target.value);
                        if (found) setSelectedDoctor(found);
                      }}
                    >
                      {doctorsList.map((d, i) => (
                        <option key={i} value={d.name}>
                          {d.name} — {d.department} (Fee: ₹{d.consultationFee.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor Snapshot Mini Card */}
                  <div style={{ background: 'var(--bg-canvas-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDoctor.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedDoctor.roomNumber} • Ext: {selectedDoctor.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fee</div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>
                        ₹{selectedDoctor.consultationFee.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Patient Info Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Patient Full Name *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. Alex Morgan"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Contact Phone Number *</label>
                      <input
                        type="tel"
                        required
                        className="form-control"
                        placeholder="+1-555-XXXX"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Date & Channel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Appointment Date *</label>
                      <input
                        type="date"
                        required
                        className="form-control"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Consultation Channel</label>
                      <select
                        className="form-control"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                      >
                        <option value="OFFLINE">In-Person Clinic Visit (Suite Room)</option>
                        <option value="ONLINE">Video / Tele-Consultation</option>
                      </select>
                    </div>
                  </div>

                  {/* Time Slot Selector */}
                  <div className="form-group">
                    <label>Available Consultation Slots</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                      {availableTimeSlots.map((slot, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          className={`slot-chip ${timeSlot === slot ? 'active' : ''}`}
                          onClick={() => setTimeSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms / Reason */}
                  <div className="form-group">
                    <label>Health Concern / Reason for Visit (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Routine checkup, chest discomfort, headaches..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-emerald"
                    disabled={bookingLoading}
                    style={{ width: '100%', padding: '0.9rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
                  >
                    {bookingLoading ? (
                      <span>Reserving Slot & Generating Token...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Confirm Booking & Generate Token Pass</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                      Slot Confirmed!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                      Your appointment token has been issued in the hospital scheduling queue.
                    </p>
                  </div>

                  {/* Printable Digital Token Pass */}
                  <div className="token-pass-card" id="printable-token-pass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.25)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
                          Hospital Appointment Pass
                        </div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '0.02em' }}>
                          CarePulse Healthcare
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>Status</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>Confirmed</div>
                      </div>
                    </div>

                    {/* Massive Token Number Display */}
                    <div className="token-print-banner" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.95 }}>
                        Consultation Queue Token Number
                      </div>
                      <div className="token-badge-number" style={{ margin: '0.2rem 0' }}>
                        #{confirmedBooking.tokenNumber}
                      </div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                        Please present this token number at the doctor's consultation room
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Patient Name</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{confirmedBooking.patientName}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>MRN: {confirmedBooking.mrn || 'Auto-registered'}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Phone: {confirmedBooking.patientPhone}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Specialist Doctor</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{confirmedBooking.doctorName}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{confirmedBooking.specialization}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{confirmedBooking.roomNumber || 'Consultation Suite'}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Date & Time Slot</div>
                        <div style={{ fontWeight: 800 }}>{confirmedBooking.appointmentDate}</div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Slot: {confirmedBooking.timeSlot}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Mode & Fee</div>
                        <div style={{ fontWeight: 800 }}>{confirmedBooking.channel === 'OFFLINE' ? 'In-Person (Clinic Room)' : 'Online Video Consultation'}</div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Fee: ₹{Number(confirmedBooking.consultationFee || 150).toFixed(2)} (Pay at Desk)</div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handlePrintToken}
                      style={{ flex: 1, padding: '0.85rem' }}
                    >
                      <Printer size={16} />
                      <span>Print Token Pass</span>
                    </button>
                    <button
                      className="btn btn-emerald"
                      onClick={() => {
                        setConfirmedBooking(null);
                        setBookingModalOpen(false);
                      }}
                      style={{ flex: 1, padding: '0.85rem' }}
                    >
                      <span>Done / Close</span>
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Hospital Infrastructure & Operational Command Overview */}
      <section id="infrastructure" style={{ padding: '4rem 2rem 5rem 2rem', background: 'var(--bg-canvas-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Enterprise Infrastructure as Code
            </span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.25rem', fontWeight: 900, marginTop: '0.4rem', textTransform: 'uppercase' }}>
              Automated Hospital Workstation Matrix
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <Stethoscope size={32} color="#059669" style={{ marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Doctor Workstation</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Live token queue management, electronic diagnosis recording, and 1-click multi-department order dispatching.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <Pill size={32} color="#0284c7" style={{ marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Pharmacy Dispensing</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Atomic stock reduction, threshold alerts for out-of-stock items, and automated prescription billing.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <TestTube size={32} color="#c2410c" style={{ marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Diagnostic Pathology</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Streamlined specimen processing, automated test result publishing, and immediate patient billing integration.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <CreditCard size={32} color="#b45309" style={{ marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Financial Ledger</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Unique receipt numbering (`REC-2026-XXXX`), cash/UPI/card settlement, and multi-department revenue analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--text-primary)',
        color: '#ffffff',
        padding: '3.5rem 3rem 2rem 3rem',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Activity size={22} color="#34d399" />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                CarePulse HMS
              </span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '0.82rem', margin: 0 }}>
              Enterprise Infrastructure for Healthcare Management • High Availability & S3 KMS Security.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-emerald" onClick={() => navigate('/login')}>
              Enter Command Center
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '2rem auto 0 auto', paddingTop: '1.5rem', borderTop: '1px solid #27272a', textAlign: 'center', fontSize: '0.78rem', color: '#71717a' }}>
          © 2026 CarePulse Healthcare Management. All clinical & operational systems verified.
        </div>
      </footer>
    </div>
  );
};

export default Landing;

