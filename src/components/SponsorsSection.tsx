import EditableText from './EditableText';
import EditableImage from './EditableImage';

const SponsorsSection = ({ onContactClick, isAdmin }: { onContactClick: () => void, isAdmin: boolean }) => (
  <section id="sponsors">
    <div className="container">
      <EditableText 
        contentKey="sponsors_title" 
        defaultText="Our Sponsors & Partners" 
        isAdmin={isAdmin} 
        tagName="h2" 
        className="section-title"
      />
      <EditableText 
        contentKey="sponsors_intro" 
        defaultText="We are grateful for the generous support of our sponsors and partners who make our mission work possible. Their commitment enables us to provide quality healthcare to those who need it most." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}
      />

      <div className="sponsor-grid">
        <div className="sponsor-card">
          <EditableImage contentKey="sponsor_medical_icon" defaultIcon="🏥" isAdmin={isAdmin} />
          <EditableText contentKey="sponsor_medical_title" defaultText="Medical Partners" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="sponsor_medical_text" defaultText="Healthcare organizations providing equipment, supplies, and medical expertise to support our mission trips." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="sponsor-card">
          <EditableImage contentKey="sponsor_church_icon" defaultIcon="⛪" isAdmin={isAdmin} />
          <EditableText contentKey="sponsor_church_title" defaultText="Church Partners" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="sponsor_church_text" defaultText="Faith communities that send volunteers, raise funds, and support our ongoing ministry in El Seibo." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="sponsor-card">
          <EditableImage contentKey="sponsor_pharma_icon" defaultIcon="💊" isAdmin={isAdmin} />
          <EditableText contentKey="sponsor_pharma_title" defaultText="Pharmaceutical Donors" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="sponsor_pharma_text" defaultText="Companies and organizations providing essential medications and medical supplies for our clinics." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="sponsor-card">
          <EditableImage contentKey="sponsor_local_icon" defaultIcon="🤝" isAdmin={isAdmin} />
          <EditableText contentKey="sponsor_local_title" defaultText="Local Partners" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="sponsor_local_text" defaultText="Dominican organizations and community leaders who help us serve effectively and sustainably." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="sponsor-card">
          <EditableImage contentKey="sponsor_edu_icon" defaultIcon="🎓" isAdmin={isAdmin} />
          <EditableText contentKey="sponsor_edu_title" defaultText="Educational Institutions" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="sponsor_edu_text" defaultText="Universities and training programs that send student volunteers and provide learning opportunities." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="sponsor-card">
          <EditableImage contentKey="sponsor_corp_icon" defaultIcon="💼" isAdmin={isAdmin} />
          <EditableText contentKey="sponsor_corp_title" defaultText="Corporate Sponsors" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="sponsor_corp_text" defaultText="Businesses that provide financial support and resources to expand our reach and impact." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', marginTop: '3rem', textAlign: 'center' }}>
        <EditableText 
          contentKey="sponsor_become_title" 
          defaultText="Become a Sponsor" 
          isAdmin={isAdmin} 
          tagName="h3" 
          style={{ color: '#2c5aa0', marginBottom: '1rem' }}
        />
        <EditableText 
          contentKey="sponsor_become_text" 
          defaultText="Are you interested in partnering with El Seibo Mission? We welcome sponsorships from organizations, churches, businesses, and groups who share our vision of bringing healthcare to underserved communities." 
          isAdmin={isAdmin} 
          tagName="p" 
          multiline={true}
          style={{ maxWidth: '700px', margin: '0 auto 1.5rem' }}
        />
        <button onClick={onContactClick}>Contact Us About Sponsorship</button>
      </div>
    </div>
  </section>
);

export default SponsorsSection;
