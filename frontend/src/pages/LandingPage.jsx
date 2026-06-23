import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import {
  Videocam,
  Chat,
  Security,
  Tv,
  EmojiEmotions,
  Speed,
  ArrowForward,
  CheckCircleOutlined
} from '@mui/icons-material';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    if (path.startsWith('/#')) {
      const id = path.substring(2);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  // Scroll to hash elements if loaded with path like /#features
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const features = [
    {
      icon: <Videocam sx={{ fontSize: 40, color: 'var(--primary)' }} />,
      title: 'HD Peer-to-Peer Video',
      description: 'Crystal-clear audio and video powered by WebRTC with automatic layout adjustment.'
    },
    {
      icon: <Chat sx={{ fontSize: 40, color: 'var(--secondary)' }} />,
      title: 'Persistent Chat',
      description: 'Real-time room chat with typing indicators, unread badges, and complete database history.'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'var(--accent-pink)' }} />,
      title: 'Waiting Room Gatekeeper',
      description: 'Host-controlled waiting rooms. Approve or deny participant entry with a single click.'
    },
    {
      icon: <Tv sx={{ fontSize: 40, color: 'var(--success)' }} />,
      title: 'Ultra-low Latency Sharing',
      description: 'Present documents, presentations, or your entire desktop screen with one-click sharing.'
    },
    {
      icon: <EmojiEmotions sx={{ fontSize: 40, color: 'var(--warning)' }} />,
      title: 'Expressive Emoji Reactions',
      description: 'Send reactions, clap hands, raise your hand, or express yourself with floating live animations.'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#FF7A00' }} />,
      title: 'Network Quality Check',
      description: 'Real-time network connectivity and strength feedback indicators for each peer.'
    }
  ];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Floating Blobs */}
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* HERO SECTION */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7} className="animate-fade-in">
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.8,
                borderRadius: '99px',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                background: 'rgba(139, 92, 246, 0.08)',
                mb: 3,
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>
                MEET THE FUTURE OF CONFERENCING
              </Typography>
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.8rem', sm: '3.8rem', md: '4.5rem' },
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: '-2px',
                mb: 3,
                background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Where connections happen in a <span style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>bLINK</span>.
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'var(--text-secondary)',
                fontWeight: 400,
                lineHeight: 1.5,
                mb: 4,
                maxWidth: '580px',
                fontSize: { xs: '1.1rem', md: '1.25rem' }
              }}
            >
              Experience a premium, secure, and blazing-fast video conferencing tool built for modern teams. WebRTC P2P streams, persistent chats, and smart meeting rooms.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(user ? '/dashboard' : '/register')}
                endIcon={<ArrowForward />}
                sx={{
                  py: 1.8,
                  px: 4,
                  fontSize: '1rem',
                  boxShadow: '0 8px 25px rgba(139, 92, 246, 0.35)',
                }}
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{
                  py: 1.8,
                  px: 4,
                  fontSize: '1rem',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                  '&:hover': {
                    borderColor: 'var(--text-secondary)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                Learn More
              </Button>
            </Stack>
          </Grid>

          {/* Glowing Mockup Card */}
          <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: '450px',
                aspectRatio: '4/3',
                borderRadius: '24px',
                padding: '8px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-20px',
                  left: '-20px',
                  right: '-20px',
                  bottom: '-20px',
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
                  zIndex: -1,
                  filter: 'blur(30px)'
                }
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(9, 9, 11, 0.85)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}
              >
                {/* Header Mock */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  </Stack>
                  <Box sx={{ px: 1.5, py: 0.4, borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Room ID: blink-meet-now
                    </Typography>
                  </Box>
                </Box>

                {/* Body Mock Video Feeds */}
                <Grid container spacing={1.5} sx={{ my: 3 }}>
                  <Grid item xs={6}>
                    <Box sx={{ aspectRatio: '16/9', borderRadius: '12px', background: 'linear-gradient(45deg, #18181B 0%, #27272A 100%)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" sx={{ width: 40, height: 40 }} />
                      <Box sx={{ position: 'absolute', bottom: 6, left: 6, px: 0.8, py: 0.2, borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#fff' }}>Sarah (You)</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ aspectRatio: '16/9', borderRadius: '12px', background: 'linear-gradient(45deg, #18181B 0%, #27272A 100%)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" sx={{ width: 40, height: 40 }} />
                      <Box sx={{ position: 'absolute', bottom: 6, left: 6, px: 0.8, py: 0.2, borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#fff' }}>David</Typography>
                      </Box>
                      <Box sx={{ position: 'absolute', top: 6, right: 6, px: 0.6, py: 0.2, borderRadius: '4px', backgroundColor: 'var(--primary)', color: '#fff', fontSize: '0.55rem', fontWeight: 'bold' }}>
                        Speaking
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Footer Controls Mock */}
                <Stack direction="row" justifyContent="center" spacing={1.5}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Videocam sx={{ fontSize: 16, color: '#fff' }} />
                  </Box>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Chat sx={{ fontSize: 16, color: '#fff' }} />
                  </Box>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>END</Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* FEATURES SECTION */}
      <Box id="features" sx={{ py: 12, borderTop: '1px solid var(--card-border)', backgroundColor: 'rgba(9, 9, 11, 0.4)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h6" sx={{ color: 'var(--primary)', fontWeight: 600, mb: 1, letterSpacing: '2px' }}>
              FEATURES
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2.2rem', md: '3rem' } }}>
              Everything you need in a meet
            </Typography>
            <Typography variant="h6" sx={{ color: 'var(--text-secondary)', fontWeight: 400, maxWidth: '600px', mx: 'auto' }}>
              bLINK wraps standard WebRTC video feeds in a suite of collaboration tools designed to bring teams closer.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    transition: 'var(--transition-smooth)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: 'rgba(139, 92, 246, 0.4)',
                      boxShadow: '0 12px 30px rgba(139, 92, 246, 0.12)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontSize: '1.25rem' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* WHY CHOOSE BLINK SECTION */}
      <Box id="why" sx={{ py: 12, borderTop: '1px solid var(--card-border)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: 'var(--primary)', fontWeight: 600, mb: 1, letterSpacing: '2px' }}>
                WHY CHOOSE BLINK
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: '2.2rem', md: '3rem' }, lineHeight: 1.1 }}>
                Built differently for professional collaboration
              </Typography>
              <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                Unlike other video tools that feel bloated and slow, bLINK prioritizes direct connection speeds, a beautiful focused interface, and advanced features like secure waiting lists.
              </Typography>

              <Stack spacing={2.5}>
                {[
                  'Secure password hashing using bcrypt',
                  'Google STUN servers for reliable NAT traversal',
                  'In-meeting floating live reaction logs',
                  'Dynamic layouts with camera auto-resizing',
                  'Automatic call duration logging and chat archives'
                ].map((item, index) => (
                  <Stack direction="row" spacing={1.5} alignItems="center" key={index}>
                    <CheckCircleOutlined sx={{ color: 'var(--success)' }} />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>

            {/* Statistics Dashboard mock */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  background: 'var(--card-bg)',
                  backdropFilter: 'var(--glass-blur)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--glass-shadow)',
                  borderRadius: '24px',
                  p: 4
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                  Network Performance
                </Typography>
                
                <Stack spacing={3.5}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Connection Success Rate</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--success)', fontWeight: 700 }}>99.8%</Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <Box sx={{ width: '99.8%', height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)' }} />
                    </Box>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>WebRTC Audio/Video Latency</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--secondary)', fontWeight: 700 }}>~45ms</Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <Box sx={{ width: '15%', height: '100%', backgroundColor: 'var(--secondary)' }} />
                    </Box>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Screen Share Bitrate</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--accent-pink)', fontWeight: 700 }}>60 FPS @ 1080p</Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <Box sx={{ width: '90%', height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-pink) 100%)' }} />
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ABOUT SECTION */}
      <Box id="about" sx={{ py: 12, borderTop: '1px solid var(--card-border)', backgroundColor: 'rgba(9, 9, 11, 0.2)' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: 'var(--primary)', fontWeight: 600, mb: 1, letterSpacing: '2px' }}>
            ABOUT BLINK
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: '2.2rem', md: '3rem' } }}>
            Redefining virtual teamwork
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)', maxW: '750px', mx: 'auto', fontSize: '1.15rem', lineHeight: 1.7, mb: 6 }}>
            bLINK was created to break down barriers in hybrid cooperation. We believe that professional video calls shouldn't require complex client installations, bloated user accounts, or laggy media pipes. By leveraging clean P2P mesh WebRTC setups and lightweight Socket.io signaling channels, we deliver high-fidelity interaction straight to your browser.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            sx={{ py: 1.8, px: 5, fontSize: '1.05rem' }}
          >
            Start Connecting
          </Button>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ py: 6, borderTop: '1px solid var(--card-border)', backgroundColor: '#09090B' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    borderRadius: '8px',
                    p: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Videocam sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                  bLINK
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px' }}>
                Secure, high-fidelity video conferencing and real-time collaboration. Made for startup velocities.
              </Typography>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'var(--text-primary)' }}>Product</Typography>
              <Stack spacing={1}>
                <Typography variant="body2" onClick={() => handleNavClick('/#features')} sx={{ color: 'var(--text-secondary)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>Features</Typography>
                <Typography variant="body2" onClick={() => handleNavClick('/#why')} sx={{ color: 'var(--text-secondary)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>Why Us</Typography>
                <Typography variant="body2" onClick={() => handleNavClick('/#about')} sx={{ color: 'var(--text-secondary)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>About</Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'var(--text-primary)' }}>Auth</Typography>
              <Stack spacing={1}>
                <Typography variant="body2" onClick={() => navigate('/login')} sx={{ color: 'var(--text-secondary)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>Sign In</Typography>
                <Typography variant="body2" onClick={() => navigate('/register')} sx={{ color: 'var(--text-secondary)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>Sign Up</Typography>
                {user && <Typography variant="body2" onClick={() => navigate('/dashboard')} sx={{ color: 'var(--text-secondary)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>Dashboard</Typography>}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'var(--text-primary)' }}>Technology Stack</Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                React 19 + Vite, Material UI, WebRTC, Socket.io, Node.js, Express, MongoDB, and Mongoose.
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4, borderColor: 'var(--card-border)' }} />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} bLINK. All rights reserved. Built with premium SaaS aesthetics.
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              Design inspired by Linear & Vercel.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
