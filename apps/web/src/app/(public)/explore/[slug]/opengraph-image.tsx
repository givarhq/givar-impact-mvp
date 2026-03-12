import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Givar Project Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
    // Parallel fetch: Project Details + Live FX Rates
    const [project, fxData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${params.slug}`).then(res => res.json()),
        fetch('https://open.er-api.com/v6/latest/NGN').then(res => res.json()).catch(() => null)
    ]);

    const raised = Number(project.raisedAmount || 0) / 100;
    const target = Number(project.targetAmount || 0) / 100;
    const percent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

    // Calculate USD approx for the card
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
                    backgroundColor: '#fff',
                    padding: '40px',
                    fontFamily: 'sans-serif',
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
                    {/* Left: Image */}
                    <div style={{ display: 'flex', width: '50%', height: '100%', position: 'relative' }}>
                        <img
                            src={project.imageUrl || 'https://givar.vercel.app/Givar1.png'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* Right: Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '50%',
                            padding: '60px 40px',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <img src="https://givar.vercel.app/Givar1.png" width="40" height="40" style={{ borderRadius: '10px' }} />
                                <span style={{ marginLeft: '12px', fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Givar.</span>
                            </div>
                            <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#064e3b', lineHeight: 1.1, margin: 0 }}>
                                {project.title}
                            </h1>
                            <p style={{ fontSize: '20px', color: '#6b7280', marginTop: '20px' }}>{project.location || 'Verified Cause'}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{percent}% Funded</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#064e3b' }}>₦{(target).toLocaleString()}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9ca3af' }}>≈ ${usdGoal.toLocaleString()} USD</span>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#10b981' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}