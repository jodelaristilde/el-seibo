import EditableText from './EditableText';
import HomeBanner from './HomeBanner';

const HomeSection = ({ isAdmin }: { isAdmin: boolean }) => (
  <section id="home">
    <div className="hero">
      <EditableText 
        contentKey="home_hero_title" 
        defaultText="Bringing Hope and Healing to El Seibo" 
        isAdmin={isAdmin} 
        tagName="h2" 
      />
      <EditableText 
        contentKey="home_hero_subtitle" 
        defaultText="A medical mission dedicated to serving the communities of El Seibo, Dominican Republic" 
        isAdmin={isAdmin} 
        tagName="p" 
      />
    </div>

    <HomeBanner isAdmin={isAdmin} />

    <div className="container" style={{ marginTop: '2rem' }}>
      <EditableText 
        contentKey="home_welcome_title" 
        defaultText="Welcome to El Seibo Mission" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ textAlign: 'center', marginBottom: '1rem' }}
      />
      <EditableText 
        contentKey="home_welcome_text" 
        defaultText="Our mission is to provide essential medical care, hope, and compassion to the underserved communities in and around El Seibo, Dominican Republic. Through our dedicated team of volunteers and healthcare professionals, we strive to make a lasting impact on the lives of those we serve." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
      />
    </div>
  </section>
);

export default HomeSection;
