const Imprint = () => {
  return (
    <div className="Imprint" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: 'white', lineHeight: 1.7 }}>
      <h1>Terms of Service</h1>
      <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Last updated: May 2026</p>

      <h2>1. About this project</h2>
      <p>
        ft_transcendence is a student project developed as part of the 42 school curriculum.
        It is intended solely for educational purposes and is not a commercial product or service.
      </p>

      <h2>2. User accounts</h2>
      <p>
        Authentication is handled via the official 42 API (OAuth2). By logging in, you agree to
        the <a href="https://www.42.fr" target="_blank" rel="noreferrer" style={{ color: '#90caf9' }}>42 Network's terms</a>.
        You are responsible for any activity performed under your account.
      </p>

      <h2>3. Data collection</h2>
      <p>
        This application stores the following data in a local SQLite database:
      </p>
      <ul>
        <li>Your 42 login and email address</li>
        <li>Your profile avatar (URL from the 42 API)</li>
        <li>Your game statistics (wins and losses)</li>
      </ul>
      <p>
        No data is shared with third parties. All data is stored locally on the server
        running this application and is used exclusively to provide the game experience.
      </p>

      <h2>4. Game data</h2>
      <p>
        Player cards are fetched in real time from the 42 API and are not permanently stored.
        Game results (wins/losses) are recorded for leaderboard and profile purposes only.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        You agree not to attempt to exploit, hack, or disrupt the application or its infrastructure.
        This project is deployed in a controlled educational environment; misuse may be reported
        to school staff.
      </p>

      <h2>6. Disclaimer</h2>
      <p>
        This project is provided as-is for educational evaluation. The developers make no
        guarantees regarding uptime, data persistence, or fitness for any purpose beyond
        the 42 school project requirements.
      </p>

      <h2>7. Contact</h2>
      <p>
        This project was developed by 42 students. For any questions, please reach out
        through the 42 intranet.
      </p>
    </div>
  );
};

export default Imprint;