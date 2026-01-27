import EditableText from './EditableText';

const AboutSection = ({ isAdmin }: { isAdmin: boolean }) => (
  <section id="about">
    <div className="container">
      <EditableText 
        contentKey="about_title" 
        defaultText="About El Seibo Mission" 
        isAdmin={isAdmin} 
        tagName="h2" 
        className="section-title"
      />
      
      <EditableText 
        contentKey="about_history_title" 
        defaultText="Our History" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_history_text" 
        defaultText="El Seibo Mission serves the communities in and around El Seibo, Dominican Republic, a region with a rich but challenging history. The area has long been associated with the sugar industry, where many Haitian migrants and their descendants have worked in the sugarcane fields under difficult conditions." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />
      <EditableText 
        contentKey="about_bateys_title" 
        defaultText="The Bateys of El Seibo" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_bateys_text_1" 
        defaultText="El Seibo province is home to many of the approximately 425 batey communities that exist across the Dominican Republic. These settlements house around 200,000 people total across the country, with significant concentrations in El Seibo and neighboring provinces..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />
      <EditableText 
        contentKey="about_bateys_text_2" 
        defaultText="The bateys began forming in the early 20th century when large numbers of Haitians migrated to the Dominican Republic for seasonal sugarcane work..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />

      <EditableText 
        contentKey="about_daily_life_title" 
        defaultText="Daily Life in the Bateys" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_daily_life_text_1" 
        defaultText="Housing in the bateys consists of rudimentary structures made of wood or corrugated metal, often with slatted wood walls, tin roofs, and dirt floors..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />
      <EditableText 
        contentKey="about_daily_life_text_2" 
        defaultText="83% of the population of the bateys lacks access to drinking water. In communities like Batey Nueve, residents share water from a free water tank, but the water is not treated..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />

      <EditableText 
        contentKey="about_health_crisis_title" 
        defaultText="Health Crisis in the Bateys" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_health_crisis_text" 
        defaultText="The health conditions in batey communities are among the worst in the Dominican Republic. Chronic malnutrition is highest in the bateys, and only 36% of children aged 18-29 months are fully vaccinated..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />

      <EditableText 
        contentKey="about_citizenship_title" 
        defaultText="The Citizenship Crisis" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_citizenship_text" 
        defaultText="Perhaps the most devastating aspect of batey life is the documentation crisis. The Constitution of the Dominican Republic does not extend citizenship to children born to non-naturalized Haitian parents..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />

      <EditableText 
        contentKey="about_isolation_title" 
        defaultText="Geographic and Social Isolation" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_isolation_text_1" 
        defaultText="Geographically and socially isolated, bateys lack basic healthcare, adequate water and sanitation, and access to education..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />
      <EditableText 
        contentKey="about_isolation_text_2" 
        defaultText="In the mid-1990s, when world markets switched from cane sugar to high-fructose corn syrup, the Dominican government was forced to privatize the sugar industry..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />

      <EditableText 
        contentKey="about_resilience_title" 
        defaultText="Culture and Resilience" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_resilience_text_1" 
        defaultText="Despite these overwhelming challenges, there is a strong sense of community and resilience in the bateys, where people rely on each other for support..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />
      <EditableText 
        contentKey="about_resilience_text_2" 
        defaultText="Gaga, a vibrant form of music and dance linked to Holy Week celebrations, is particularly prominent in bateys..." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />

      <EditableText 
        contentKey="about_mission_title" 
        defaultText="Our Mission" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_mission_text" 
        defaultText="El Seibo Mission was founded to address these critical healthcare needs. We provide medical services, health education, and compassionate care to those who need it most. Our work focuses on:" 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
        style={{ marginBottom: '1.5rem' }}
      />
      <ul style={{ marginLeft: '2rem', marginBottom: '1.5rem' }}>
        <li>Delivering primary healthcare to underserved batey communities</li>
        <li>Providing preventive care and health education</li>
        <li>Offering medical services regardless of documentation status or ability to pay</li>
        <li>Building relationships and trust within the communities we serve</li>
        <li>Partnering with local organizations to create sustainable healthcare solutions</li>
      </ul>

      <EditableText 
        contentKey="about_impact_title" 
        defaultText="Our Impact" 
        isAdmin={isAdmin} 
        tagName="h3" 
        style={{ color: '#2c5aa0', marginTop: '2rem' }}
      />
      <EditableText 
        contentKey="about_impact_text" 
        defaultText="Through regular medical mission trips and ongoing partnerships, we've been able to serve thousands of patients, many of whom are Haitian migrants and their families who work or have worked in the sugarcane industry. We believe every person deserves access to quality healthcare and the dignity of compassionate medical treatment." 
        isAdmin={isAdmin} 
        tagName="p" 
        multiline={true}
      />
    </div>
  </section>
);

export default AboutSection;
