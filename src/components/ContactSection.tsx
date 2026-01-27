import EditableText from './EditableText';

const ContactSection = ({ isAdmin }: { isAdmin: boolean }) => (
  <section id="contact">
    <div className="container">
      <EditableText 
        contentKey="contact_title" 
        defaultText="Contact Us" 
        isAdmin={isAdmin} 
        tagName="h2" 
        className="section-title"
      />
      <EditableText 
        contentKey="contact_intro" 
        defaultText="Interested in learning more about El Seibo Mission or how you can get involved? We'd love to hear from you." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '2rem' }}
      />
      
      <div style={{ maxWidth: '600px' }}>
        <EditableText 
          contentKey="contact_subtitle" 
          defaultText="Get In Touch" 
          isAdmin={isAdmin} 
          tagName="h3" 
          style={{ color: '#2c5aa0', marginBottom: '1rem' }}
        />
        <p><strong>Email:</strong> <EditableText contentKey="contact_email" defaultText="info@elseibomission.com" isAdmin={isAdmin} tagName="span" /></p>
        <p><strong>Location:</strong> <EditableText contentKey="contact_location" defaultText="El Seibo, Dominican Republic" isAdmin={isAdmin} tagName="span" /></p>
        <EditableText 
          contentKey="contact_text" 
          defaultText="Whether you're interested in joining a mission trip, making a donation, or learning more about our work, we welcome your questions and interest in serving alongside us." 
          isAdmin={isAdmin} 
          tagName="p" 
          multiline={true}
          style={{ marginTop: '1.5rem' }}
        />
      </div>
    </div>
  </section>
);

export default ContactSection;
