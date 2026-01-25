import { useState } from 'react';

const DonateSection = () => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const processDonation = () => {
    if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    alert(`Thank you for your generous donation of $${parseFloat(amount).toFixed(2)}! 
           
In a live website, this would redirect to a secure payment processor like PayPal, Stripe, or your chosen donation platform.

For now, please contact us directly to complete your donation.`);
  };

  return (
    <section id="donate">
      <div className="container">
        <h2 className="section-title">Make a Donation</h2>
        <p style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2rem' }}>
          Your generous donation directly impacts lives in El Seibo. Every contribution helps us provide essential 
          medical care, medications, and hope to families in the batey communities.
        </p>

        <div className="impact-stats">
          <div className="stat-item">
            <div className="stat-number">5,000+</div>
            <div className="stat-label">Patients Served Annually</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15+</div>
            <div className="stat-label">Batey Communities Reached</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100+</div>
            <div className="stat-label">Volunteers Each Year</div>
          </div>
        </div>

        <h3 style={{ textAlign: 'center', color: '#2c5aa0', margin: '2rem 0 1rem' }}>Ways to Give</h3>
        
        <div className="donation-options">
          <div className="donation-card" onClick={() => setAmount('50')}>
            <h3>$50</h3>
            <p><strong>Provides medications</strong></p>
            <p>for 5 patients with chronic conditions</p>
          </div>
          <div className="donation-card" onClick={() => setAmount('100')}>
            <h3>$100</h3>
            <p><strong>Supplies a medical clinic</strong></p>
            <p>with essential equipment for one day</p>
          </div>
          <div className="donation-card" onClick={() => setAmount('250')}>
            <h3>$250</h3>
            <p><strong>Sponsors comprehensive care</strong></p>
            <p>for an entire family including dental and vision</p>
          </div>
          <div className="donation-card" onClick={() => setAmount('500')}>
            <h3>$500</h3>
            <p><strong>Funds a mission trip</strong></p>
            <p>for one volunteer healthcare provider</p>
          </div>
        </div>

        <div className="custom-donation">
          <h3 style={{ color: '#2c5aa0', textAlign: 'center', marginBottom: '1.5rem' }}>Custom Donation Amount</h3>
          <div className="form-group">
            <label htmlFor="donation-amount">Amount ($):</label>
            <input 
              type="text" 
              id="donation-amount" 
              placeholder="Enter amount" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="donor-name">Name (Optional):</label>
            <input 
              type="text" 
              id="donor-name" 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="donor-email">Email (Optional):</label>
            <input 
              type="text" 
              id="donor-email" 
              placeholder="your@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button onClick={processDonation} style={{ width: '100%' }}>Continue to Donation</button>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
            Secure payment processing • Tax-deductible receipt provided
          </p>
        </div>

        <div style={{ background: '#fff8e1', padding: '2rem', borderRadius: '8px', marginTop: '3rem', borderLeft: '4px solid #ffc107' }}>
          <h3 style={{ color: '#f57c00', marginBottom: '1rem' }}>Other Ways to Support</h3>
          <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
            <li><strong>Monthly Giving:</strong> Become a sustaining partner with automatic monthly donations</li>
            <li><strong>Medical Supplies:</strong> Donate unused medical equipment and supplies</li>
            <li><strong>In-Kind Donations:</strong> Contribute medications, vitamins, or medical consumables</li>
            <li><strong>Volunteer:</strong> Join us on a mission trip and serve with your skills</li>
            <li><strong>Legacy Giving:</strong> Include El Seibo Mission in your estate planning</li>
          </ul>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontStyle: 'italic' }}>
          "For I was hungry and you gave me food, I was thirsty and you gave me drink, I was a stranger and you welcomed me, 
          I was naked and you clothed me, I was sick and you visited me..." - Matthew 25:35-36
        </p>
      </div>
    </section>
  );
};

export default DonateSection;
