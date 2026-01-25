const SponsorsSection = ({ onContactClick }: { onContactClick: () => void }) => (
  <section id="sponsors">
    <div className="container">
      <h2 className="section-title">Our Sponsors & Partners</h2>
      <p style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
        We are grateful for the generous support of our sponsors and partners who make our mission work possible. 
        Their commitment enables us to provide quality healthcare to those who need it most.
      </p>

      <div className="sponsor-grid">
        <div className="sponsor-card">
          <div className="sponsor-logo">🏥</div>
          <h3>Medical Partners</h3>
          <p>Healthcare organizations providing equipment, supplies, and medical expertise to support our mission trips.</p>
        </div>
        <div className="sponsor-card">
          <div className="sponsor-logo">⛪</div>
          <h3>Church Partners</h3>
          <p>Faith communities that send volunteers, raise funds, and support our ongoing ministry in El Seibo.</p>
        </div>
        <div className="sponsor-card">
          <div className="sponsor-logo">💊</div>
          <h3>Pharmaceutical Donors</h3>
          <p>Companies and organizations providing essential medications and medical supplies for our clinics.</p>
        </div>
        <div className="sponsor-card">
          <div className="sponsor-logo">🤝</div>
          <h3>Local Partners</h3>
          <p>Dominican organizations and community leaders who help us serve effectively and sustainably.</p>
        </div>
        <div className="sponsor-card">
          <div className="sponsor-logo">🎓</div>
          <h3>Educational Institutions</h3>
          <p>Universities and training programs that send student volunteers and provide learning opportunities.</p>
        </div>
        <div className="sponsor-card">
          <div className="sponsor-logo">💼</div>
          <h3>Corporate Sponsors</h3>
          <p>Businesses that provide financial support and resources to expand our reach and impact.</p>
        </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', marginTop: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: '#2c5aa0', marginBottom: '1rem' }}>Become a Sponsor</h3>
        <p style={{ maxWidth: '700px', margin: '0 auto 1.5rem' }}>
          Are you interested in partnering with El Seibo Mission? We welcome sponsorships from organizations, 
          churches, businesses, and groups who share our vision of bringing healthcare to underserved communities.
        </p>
        <button onClick={onContactClick}>Contact Us About Sponsorship</button>
      </div>
    </div>
  </section>
);

export default SponsorsSection;
