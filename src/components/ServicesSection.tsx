import EditableText from './EditableText';

const ServicesSection = ({ isAdmin }: { isAdmin: boolean }) => (
  <section id="services">
    <div className="container">
      <EditableText 
        contentKey="services_title" 
        defaultText="Our Services" 
        isAdmin={isAdmin} 
        tagName="h2" 
        className="section-title"
      />
      <div className="services-grid">
        <div className="service-card">
          <EditableText 
            contentKey="service_primary_title" 
            defaultText="Primary Medical Care" 
            isAdmin={isAdmin} 
            tagName="h3" 
          />
          <EditableText 
            contentKey="service_primary_text" 
            defaultText="Comprehensive medical evaluations, treatment of acute and chronic conditions, health screenings, and ongoing medical support for all ages in the batey communities." 
            isAdmin={isAdmin} 
            tagName="p" 
            multiline={true}
          />
        </div>
        <div className="service-card">
          <EditableText 
            contentKey="service_nursing_title" 
            defaultText="Nursing Home" 
            isAdmin={isAdmin} 
            tagName="h3" 
          />
          <EditableText 
            contentKey="service_nursing_text" 
            defaultText="Dedicated care facility providing compassionate medical care, daily assistance, and dignified living conditions for elderly residents in our community." 
            isAdmin={isAdmin} 
            tagName="p" 
            multiline={true}
          />
        </div>
        <div className="service-card">
          <EditableText contentKey="service_school_title" defaultText="Elementary School" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="service_school_text" defaultText="Educational programs for children in the batey communities, providing quality education, safe learning environment, and opportunities for a brighter future." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="service-card">
          <EditableText contentKey="service_food_title" defaultText="Food Distribution" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="service_food_text" defaultText="Regular food distribution programs providing nutritious meals and essential food supplies to families in need throughout the El Seibo region." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="service-card">
          <EditableText contentKey="service_immigration_title" defaultText="Immigration Services" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="service_immigration_text" defaultText="Assistance with documentation, legal support, and navigation of immigration processes to help community members obtain proper identification and legal status." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="service-card">
          <EditableText contentKey="service_dental_title" defaultText="Dental Services" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="service_dental_text" defaultText="Basic dental care, cleanings, extractions, and oral health education to improve dental hygiene and overall health." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="service-card">
          <EditableText contentKey="service_pharmacy_title" defaultText="Pharmacy Services" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="service_pharmacy_text" defaultText="Distribution of essential medications and supplements to treat diagnosed conditions and support ongoing health management." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
        <div className="service-card">
          <EditableText contentKey="service_vision_title" defaultText="Vision Care" isAdmin={isAdmin} tagName="h3" />
          <EditableText contentKey="service_vision_text" defaultText="Eye examinations and distribution of reading glasses to improve quality of life and daily functioning." isAdmin={isAdmin} tagName="p" multiline={true} />
        </div>
      </div>
    </div>
  </section>
);

export default ServicesSection;
