import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Givar Project Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.givarapp.com/api';
    const v1ApiUrl = apiUrl.endsWith('/v1') ? apiUrl : `${apiUrl}/v1`;

    // Parallel fetch: Project Details + Live FX Rates
    const [project, fxData] = await Promise.all([
        fetch(`${v1ApiUrl}/projects/${slug}`, { next: { revalidate: 0 } })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
        fetch('https://open.er-api.com/v6/latest/NGN', { next: { revalidate: 3600 } })
            .then(res => res.json())
            .catch(() => null)
    ]);

    if (!project) {
        return new ImageResponse(
            <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <img src="https://givarapp.com/Givar1.png" width="120" height="120" />
            </div>
        );
    }

    // Defensive Parsing
    const rawRaised = project.raisedAmount ? String(project.raisedAmount).replace(/[^0-9]/g, '') : '0';
    const rawTarget = project.targetAmount ? String(project.targetAmount).replace(/[^0-9]/g, '') : '0';

    const raised = Number(rawRaised) / 100;
    const target = Number(rawTarget) / 100;

    // Reverted to Math.floor to match TransparencyCard BigInt division behavior
    const percent = target > 0 ? Math.min(100, Math.floor((raised / target) * 100)) : 0;

    const usdRate = fxData?.rates?.USD || 0.00065;
    const usdGoal = Math.round(target * usdRate);

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    padding: '40px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        height: '100%',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fafafa',
                    }}
                >
                    {/* Left Column: Image */}
                    <div style={{ display: 'flex', width: '50%', height: '100%', backgroundColor: '#f1f5f9' }}>
                        <img
                            src={project.imageUrl || 'https://givarapp.com/Givar1.png'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* Right Column: Stats */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '50%',
                            padding: '60px 40px',
                            justifyContent: 'space-between',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                <img src="https://givarapp.com/Givar1.png" width="48" height="48" style={{ borderRadius: '12px' }} />
                                <div style={{ display: 'flex', marginLeft: '16px', fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                                    Givar.
                                </div>
                            </div>
                            <div style={{ display: 'flex', fontSize: '44px', fontWeight: 900, color: '#064e3b', lineHeight: 1.1 }}>
                                {project.title}
                            </div>
                            <div style={{ display: 'flex', marginTop: '16px' }}>
                                <div style={{ display: 'flex', fontSize: '20px', color: '#6b7280', fontWeight: 600 }}>{project.location || 'Verified Cause'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{percent}% Funded</div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    {/* NGN Goal (Text format) */}
                                    <div style={{ display: 'flex', fontSize: '20px', fontWeight: 'bold', color: '#064e3b', alignItems: 'center' }}>
                                        <span style={{ marginRight: '6px' }}>Goal:</span>
                                        <span>{target.toLocaleString()}</span>
                                        <span style={{ marginLeft: '4px' }}>NGN</span>
                                    </div>

                                    {/* USD Estimate (Text format) */}
                                    <div style={{ display: 'flex', fontSize: '15px', fontWeight: 'bold', color: '#9ca3af', marginTop: '4px' }}>
                                        <span style={{ marginRight: '4px' }}>≈</span>
                                        <span>{usdGoal.toLocaleString()}</span>
                                        <span style={{ marginLeft: '4px' }}>USD</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', width: '100%', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                                <div style={{
                                    display: 'flex',
                                    width: `${percent}%`,
                                    height: '100%',
                                    backgroundColor: '#10b981',
                                    borderRadius: '8px'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}